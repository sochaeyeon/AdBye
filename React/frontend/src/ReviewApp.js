import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell } from "recharts";
import "./App.css";
import api from './services/api';

const SimilarityChart = ({ score }) => {
  const data = [
    { name: "유사도", value: score ?? 0 },
    { name: "나머지", value: 100 - (score ?? 0) },
  ];
  const COLORS = ["#e6f911ff", "#E0E0E0"];

  return (
    <div className="flex flex-col items-center justify-center my-4">
      <PieChart width={120} height={120}>
        <Pie
          data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
          dataKey="value" startAngle={90} endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute text-center">
        <span className="text-xl font-bold">{(score ?? 0).toFixed(1)}%</span>
      </div>
    </div>
  );
};

const TruncatedTextAi = ({ text, maxLength }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayText = text ?? "";
  if (displayText.length <= maxLength) return <span>{displayText}</span>;

  return (
    <div>
      <span>{isExpanded ? displayText : `${displayText.substring(0, maxLength)}...`}</span>
      <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="toggle-text-button">
        {isExpanded ? "간략히 보기" : "더 보기"}
      </button>
    </div>
  );
};

const TruncatedText = ({ text, maxLength }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayText = text ?? "";
  const truncated = displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText;
  const formattedText = (isExpanded ? displayText : truncated)
    .replace(/([•✔])/g, "\n$1").replace(/(\. )/g, ".\n");

  return (
    <div>
      {formattedText.split("\n").map((line, idx) => (
        <p key={idx} style={{ margin: '4px 0' }}>{line}</p>
      ))}
      {displayText.length > maxLength && (
        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="toggle-text-button" style={{ color: "#8b8b8bff", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {isExpanded ? "간략히 보기" : "더 보기"}
        </button>
      )}
    </div>
  );
};

function ReviewApp() {
  const [review, setReview] = useState("");
  const [placeholder, setPlaceholder] = useState("이미지 또는 텍스트 업로드");
  const [showSimilar, setShowSimilar] = useState(false);
  const [reviewsData, setReviewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [pastedImage, setPastedImage] = useState(null);
  const [loadingText, setLoadingText] = useState("분석 중");

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const textareaRef = useRef(null);

  const categories = ["패션잡화", "식품건강", "뷰티", "생활주방", "유아동", "스포츠레저", "가전디지털", "문구오피스"];

  useEffect(() => {
    if (loading) {
      let count = 0;
      const interval = setInterval(() => {
        count = (count + 1) % 3;
        setLoadingText("분석 중" + ".".repeat(count + 1));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [review]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    alert("로그아웃되었습니다.");
    navigate("/");
  };

  const handleCategoryClick = (name) => {
    setPlaceholder(name);
    setSelectedCategory(name);
  };

  const handleShowReview = async (textParam) => {
    const text = textParam || review;
    if (!text) { alert("리뷰 내용을 입력해주세요."); return; }

    setLoading(true);
    try {
      const response = await api.post('/review/check', {
        userReview: text,
        category: selectedCategory
      });

      const data = response.data;
      const newReview = { ...data, category: selectedCategory, timestamp: Date.now() };

      setReviewsData(prevData => [newReview, ...prevData]);
      setShowSimilar(true);
      setExpandedItems({});
    } catch (error) {
      console.error("분석 에러:", error);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleDeleteImage = () => {
    setPastedImage(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handlePaste = async (event) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            setPastedImage(e.target.result);
            setLoading(true);
            try {
              const formData = new FormData();
              formData.append("image", blob, "pasted-image.png");

              const response = await api.post('/review/ocr', formData);
              const extracted = response.data?.extractedText?.trim();

              if (!extracted) {
                alert("텍스트를 인식하지 못했습니다.");
                return;
              }
              setReview(extracted);
              handleShowReview(extracted);
            } catch (error) {
              console.error("OCR 에러:", error);
              alert("텍스트 추출에 실패했습니다.");
              setPastedImage(null);
            } finally {
              setLoading(false);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  return (
    <div className="app">
      <header className="header-top">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>re:view</div>
        <nav className="nav-menu">
          {isLoggedIn ? (
            <a href="/" onClick={handleLogout}><img src="/login.png" alt="Logout" /> 로그아웃</a>
          ) : (
            <a href="/login"><img src="/login.png" alt="Login" /> 로그인</a>
          )}
          <a href="/user/inquiry"><img src="/contact.png" alt="Contact" /> 문의하기</a>
        </nav>
      </header>

      <div style={{ display: "flex", paddingTop: "60px", minHeight: "100vh" }}>

        <div className="sidebar" style={{
          width: 300,
          flexShrink: 0,
          padding: "28px 12px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            margin: "0 0 10px 6px",
          }}>
            카테고리
          </p>

          {/* 카테고리 버튼 목록 */}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 10px",
                      borderRadius: 7,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.4)",
                      background: isSelected ? "rgba(255,255,255,0.09)" : "transparent",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                      }
                    }}
                  >
                    {cat}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 구분선 */}
          <div style={{
            margin: "16px 6px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }} />

          {/* History 버튼 */}
          <button
            onClick={() => navigate("/user/history")}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "7px 10px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(255,255,255,0.35)",
              background: "transparent",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.35)";
            }}
          >
            History
          </button>
        </div>
        {/* ── 사이드바 끝 ── */}

        <div className="content">
          <p className="main-title">AI 기반 광고성 리뷰 탐지 웹 서비스</p>
          <div className="input-area-wrapper" style={{ width: '80%', maxWidth: '700px' }}>
            <div ref={textareaRef} contentEditable className="review-input editable"
              onInput={(e) => setReview(e.currentTarget.innerText)} onPaste={handlePaste} data-placeholder={placeholder}>
              {pastedImage && (
                <div className="image-preview-container">
                  <img src={pastedImage} alt="붙여넣은 이미지" />
                  <button onClick={handleDeleteImage} className="delete-image-btn">X</button>
                </div>
              )}
            </div>
            <button className={`input-button ${loading ? "loading" : ""}`} onClick={() => handleShowReview(review)} disabled={loading}>
              {loading ? loadingText : "분석"}
            </button>
          </div>
        </div>

        <div className={`similar-review ${showSimilar ? "show" : ""}`}>
          <h3>분석 결과</h3>
          {reviewsData.length > 0 ? (
            reviewsData.map((data, index) => {
              const inputReview = data?.["입력_리뷰"] ?? "";
              const similarityScore = data?.["유사도_점수"] ?? 0;
              const mostSimilar = data?.["가장_유사한_광고_리뷰"] ?? "";
              const adKeywords = Array.isArray(data?.["광고_키워드"]) ? data["광고_키워드"] : [];
              const notAdKeywords = Array.isArray(data?.["비광고_키워드"]) ? data["비광고_키워드"] : [];
              const judgement = data?.["판단"] ?? "";
              const category = data?.category ?? "";
              const isLatest = index === 0;
              const isOpen = isLatest || expandedItems[index];

              return (
                <div key={index} className="review-result-item" onClick={() => !isLatest && toggleReviewExpand(index)}
                  style={{ cursor: isLatest ? "default" : "pointer", borderBottom: "1px solid #ddd", paddingBottom: "12px", marginBottom: "12px" }}>
                  {!isOpen ? (
                    <div className="result-item-group">
                      <p><strong>입력 리뷰 :</strong></p>
                      <div className="result-item-content">{inputReview.slice(0, 20)}...</div>
                    </div>
                  ) : (
                    <div>
                      <div className="result-item-group review-header">
                        <div className="review-label"><strong>입력 리뷰 :</strong> <span className="category-inline">{category}</span></div>
                        <div className="result-item-content"><TruncatedText text={inputReview} maxLength={100} /></div>
                        {data["요약문"] && (
                          <div className="result-summary-group">
                            <p className="summary-title">AI 요약</p>
                            <div className="summary-box"><TruncatedTextAi text={data["요약문"]} maxLength={80} /></div>
                          </div>
                        )}
                      </div>
                      <div className="result-item-group">
                        <p><strong>유사도 점수 :</strong></p>
                        <SimilarityChart score={similarityScore} />
                      </div>
                      <div className="result-item-group">
                        <p><strong>가장 유사한 광고 리뷰 :</strong></p>
                        <div className="result-item-content"><TruncatedText text={mostSimilar} maxLength={120} /></div>
                      </div>
                      <div className="result-item-group">
                        <p><strong>광고 키워드 :</strong></p>
                        <div className="keyword-container">
                          {adKeywords.map((kw, i) => <span key={i} className="keyword-tag">{kw}</span>)}
                        </div>
                      </div>
                      <div className="result-item-group">
                        <p><strong>비광고 키워드 :</strong></p>
                        <div className="keyword-container">
                          {notAdKeywords.map((kw, i) => <span key={i} className="keyword-tag">{kw}</span>)}
                        </div>
                      </div>
                      <div className="result-item-group judgement-line">
                        <strong>판단 :</strong>
                        <span className={`result-judgement ${judgement.includes("광고") ? "ad" : "not-ad"}`}>{judgement}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="no-result-text">아직 분석 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewApp;