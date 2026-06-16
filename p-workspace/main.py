from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
import mysql.connector
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import logging
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
from dotenv import load_dotenv
from database import get_db_connection

import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Ad Review Analyzer API")
logging.basicConfig(level=logging.INFO)

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.getenv("MODEL_PATH", "./finetuned_minilm_model")
model = SentenceTransformer(model_path) 

with open("keyword_weights.json", "r", encoding="utf-8") as f:
    KEYWORD_WEIGHTS = json.load(f)

AD_WEIGHTS = KEYWORD_WEIGHTS.get("AD_WEIGHTS", {})
NON_AD_WEIGHTS = KEYWORD_WEIGHTS.get("NON_AD_WEIGHTS", {})

class ReviewRequest(BaseModel):
    review: Optional[str] = None
    userReview: Optional[str] = None
    category: Optional[str] = None

class ReviewResponse(BaseModel):
    입력_리뷰: str
    가장_유사한_광고_리뷰: str
    유사도_점수: float
    label: int
    후보_리뷰들: list
    판단: str
    광고_키워드: list
    비광고_키워드: list
    요약문: str

def match_keywords(text: str, keyword_list: list) -> list:
    results = []
    for kw in keyword_list:
        pattern = re.escape(kw)
        if re.search(pattern, text, re.I):
            results.append(kw)
    return results

def is_valid_review(text: str) -> bool:
    if text is None:
        return False
    text = text.strip()
    if len(text) < 5 or text.isdigit():
        return False
    if all(ch in "!@#$%^&*()_+=-[]{};:'\",.<>?/|" for ch in text):
        return False
    return True

def safe_cosine_similarity(vec1, vec2):
    denom = (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    if denom == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / denom)

def summarize_text(text: str) -> str:
    try:
        if not text.strip():
            return ""
        prompt = f"다음 리뷰를 자연스럽게 2문장으로 요약해줘. 끝은 '~다'로 마무리해줘:\n\n{text}"
        model_gemini = genai.GenerativeModel("gemini-2.0-flash")
        response = model_gemini.generate_content(prompt)
        return response.text.strip() if response and response.text else "(요약 실패)"
    except Exception as e:
        print("❌ 요약 생성 중 오류:", e)
        return "(요약 생성 중 오류 발생)"

def analyze_review(user_review: str, category: Optional[str] = None, top_n=3):
    matched_ad_keywords = match_keywords(user_review, AD_WEIGHTS.keys())
    matched_non_ad_keywords = match_keywords(user_review, NON_AD_WEIGHTS.keys())

    if not is_valid_review(user_review):
        return {
            "입력_리뷰": user_review or "",
            "가장_유사한_광고_리뷰": "",
            "유사도_점수": 0.0,
            "label": -1,
            "후보_리뷰들": [],
            "판단": "분석 불가 (리뷰 내용 부족)",
            "광고_키워드": matched_ad_keywords,
            "비광고_키워드": matched_non_ad_keywords,
            "요약문": ""
        }

    user_vec = model.encode(user_review)
    
    vector_norm = np.linalg.norm(user_vec)
    logging.info(f"DEBUG: User Vector Dimension: {len(user_vec)}")
    logging.info(f"DEBUG: User Vector Norm (길이): {vector_norm:.4f}")
    if vector_norm < 0.1:
         logging.warning("벡터의 크기가 너무 작습니다.")

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    if category:
        cur.execute("""
            SELECT cleaned_review, label, review_vector, category
            FROM reviews
            WHERE review_vector IS NOT NULL
            AND review_vector != ''
            AND TRIM(category) = %s
            AND label = 1
        """, (category,))
    else:
        cur.execute("""
            SELECT cleaned_review, label, review_vector, category
            FROM reviews
            WHERE review_vector IS NOT NULL
            AND review_vector != ''
            AND label = 1
        """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {
            "입력_리뷰": user_review,
            "가장_유사한_광고_리뷰": "",
            "유사도_점수": 0.0,
            "label": -1,
            "후보_리뷰들": [],
            "판단": "데이터 부족 (해당 카테고리 없음)",
            "광고_키워드": matched_ad_keywords,
            "비광고_키워드": matched_non_ad_keywords,
            "요약문": ""
        }

    candidates = []
    best_score = -1.0
    best_review = ""
    best_label = -1
    for row in rows:
        try:
            review_vec = np.array(json.loads(row["review_vector"]))
            score = safe_cosine_similarity(user_vec, review_vec)
            candidates.append({"review": row["cleaned_review"], "score": float(score), "label": row["label"]})
            if score > best_score:
                best_score = score
                best_review = row["cleaned_review"]
                best_label = row["label"]
        except Exception as e:
            logging.warning(f"⚠️ 벡터 파싱 에러: {e}")
            continue

    logging.info(f"DEBUG: Pure Max Cosine Similarity (Before Adjustment): {best_score * 100:.2f}%")

    candidates.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = candidates[:top_n]

    keyword_adjustment = sum([AD_WEIGHTS.get(k, 0) for k in matched_ad_keywords]) \
                         + sum([NON_AD_WEIGHTS.get(k, 0) for k in matched_non_ad_keywords])
    
    logging.info(f"DEBUG: Keyword Adjustment Value: {keyword_adjustment:.4f}")

    final_score = max(0, min(1, best_score + keyword_adjustment))
    score_percent = round(final_score * 100, 2)
    
    logging.info(f"DEBUG: Final Score (After Adjustment): {score_percent:.2f}%")

    if score_percent >= 85:
        decision_text = "광고성 리뷰일 가능성 높음"
        best_label = 1
    elif 70 <= score_percent < 85:
        decision_text = "광고성 리뷰일 가능성 있음"
        best_label = 1
    elif 40 <= score_percent < 70:
        decision_text = "일반 리뷰일 가능성 있음"
        best_label = 0
    else:
        decision_text = "일반 리뷰일 가능성 높음"
        best_label = 0

    summary = summarize_text(user_review)

    return {
        "입력_리뷰": user_review,
        "가장_유사한_광고_리뷰": best_review,
        "유사도_점수": score_percent,
        "label": int(best_label),
        "후보_리뷰들": [{"review": c["review"], "score": round(c["score"] * 100, 2)} for c in top_candidates],
        "판단": decision_text,
        "광고_키워드": matched_ad_keywords,
        "비광고_키워드": matched_non_ad_keywords,
        "요약문": summary
    }

@app.get("/")
def root():
    return {"message": "FastAPI 서버 정상 작동 중 🚀"}

@app.post("/analyze", response_model=ReviewResponse)
def analyze(data: ReviewRequest):
    text = (data.review or data.userReview or "").strip()
    category = data.category
    logging.info(f"📦 받은 category 값: {category}")
    return analyze_review(text, category)
