import mysql.connector
import os
import random
import json
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
from database import get_db_connection

load_dotenv()

def train():
    db = get_db_connection()

    if not db:
        print("❌ DB 연결 객체를 생성할 수 없습니다.")
        return

    try:
        cursor = db.cursor(dictionary=True)
    except mysql.connector.Error as err:
        print(f"❌ 커서 생성 실패: {err}")
        return

    cursor.execute("SELECT id, cleaned_review, label FROM reviews WHERE cleaned_review IS NOT NULL")
    rows = cursor.fetchall()

    ads = [r for r in rows if r["label"] == 1]       # 광고성
    non_ads = [r for r in rows if r["label"] == 0]   # 비광고성

    print(f"📦 데이터 로드 완료: 광고성 {len(ads)}개, 비광고성 {len(non_ads)}개")

    train_examples = []

    # 광고-광고 쌍 (유사도 1.0)
    for _ in range(len(ads) // 2):
        a, b = random.sample(ads, 2)
        train_examples.append(InputExample(texts=[a["cleaned_review"], b["cleaned_review"]], label=1.0))

    # 비광고-비광고 쌍 (유사도 1.0)
    for _ in range(len(non_ads) // 2):
        a, b = random.sample(non_ads, 2)
        train_examples.append(InputExample(texts=[a["cleaned_review"], b["cleaned_review"]], label=1.0))

    # 광고-비광고 쌍 (유사도 0.0)
    for _ in range(min(len(ads), len(non_ads))):
        a = random.choice(ads)
        b = random.choice(non_ads)
        train_examples.append(InputExample(texts=[a["cleaned_review"], b["cleaned_review"]], label=0.0))

    print(f"🚀 총 학습 샘플: {len(train_examples)}개 준비됨")

    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
    model = SentenceTransformer("all-MiniLM-L6-v2")
    train_loss = losses.CosineSimilarityLoss(model)

    output_path = os.getenv("MODEL_PATH", "./finetuned_minilm_model")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=3,
        warmup_steps=int(len(train_dataloader) * 0.1),
        output_path=output_path
    )

    print(f"✅ 파인튜닝 완료! 모델이 '{output_path}' 폴더에 저장되었습니다.")

    cursor.close()
    db.close()

if __name__ == "__main__":
    train()