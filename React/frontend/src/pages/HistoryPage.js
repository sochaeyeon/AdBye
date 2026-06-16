import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요한 서비스입니다.');
        navigate('/login');
        return;
      }

      try {
        const response = await api.get('/api/history');
        const sortedHistory = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(sortedHistory);

        const grouped = sortedHistory.reduce((acc, item) => {
          const date = new Date(item.createdAt).toLocaleDateString('ko-KR');
          if (!acc[date]) acc[date] = [];
          acc[date].push(item);
          return acc;
        }, {});
        setGroupedHistory(grouped);

        const firstDate = Object.keys(grouped)[0];
        if (firstDate) setExpandedDate(firstDate);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
        } else {
          setError('분석 기록을 불러오는 중 오류가 발생했습니다.');
        }
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  const toggleDate = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#ef4444';
    if (score >= 70) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  };

  const isAd = (judgment) => judgment?.includes('광고');

  if (loading) {
    return <div style={styles.message}>로딩 중...</div>;
  }

  if (error) {
    return <div style={styles.errorMessage}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>분석 기록</h1>

      {history.length === 0 ? (
        <p style={styles.message}>아직 분석 기록이 없습니다.</p>
      ) : (
        <div style={styles.dateGroupContainer}>
          {Object.keys(groupedHistory).map((date) => {
            const isOpen = expandedDate === date;
            return (
              <div key={date} style={styles.dateGroup}>
                <h2
                  style={styles.dateHeader}
                  onClick={() => toggleDate(date)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#111111'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={styles.countBadge}>{groupedHistory[date].length}</span>
                    {date}
                  </div>
                  <span style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    display: 'inline-block',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>▼</span>
                </h2>

                {isOpen && (
                  <div style={styles.list}>
                    {groupedHistory[date].map((item) => {
                      const ad = isAd(item.judgment);
                      const scoreColor = getScoreColor(item.similarityScore);
                      return (
                        <div key={item.historyId} style={styles.card}>
                          <div style={styles.cardHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.category && (
                                <span style={styles.category}>{item.category}</span>
                              )}
                              <span style={styles.time}>
                                {new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '4px 12px',
                              borderRadius: 99,
                              background: ad ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                              color: ad ? '#ef4444' : '#22c55e',
                              border: `1px solid ${ad ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                            }}>
                              {item.judgment}
                            </span>
                          </div>

                          <div style={styles.cardBody}>
                            <p style={styles.fieldLabel}>입력 리뷰</p>
                            <p style={styles.fieldValue}>{item.inputReview}</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                              <p style={styles.fieldLabel}>유사도 점수</p>
                              <p style={{ ...styles.fieldValue, color: scoreColor, fontWeight: 700, margin: 0, fontSize: 15 }}>
                                {item.similarityScore.toFixed(2)}%
                              </p>
                            </div>

                            {item.mostSimilarReview && (
                              <>
                                <p style={{ ...styles.fieldLabel, marginTop: 12 }}>가장 유사한 광고 리뷰</p>
                                <p style={{ ...styles.fieldValue, color: '#999' }}>{item.mostSimilarReview}</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '32px 24px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: 24,
    fontWeight: 700,
    color: '#111',
  },
  message: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
  },
  errorMessage: {
    textAlign: 'center',
    fontSize: '18px',
    color: 'red',
  },
  dateGroupContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  dateGroup: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  dateHeader: {
    cursor: 'pointer',
    backgroundColor: '#111111',
    padding: '15px 20px',
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
    transition: 'background 0.15s',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
    padding: '2px 9px',
    borderRadius: 99,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fafafa',
  },
  card: {
    border: '1px solid #e8e8e8',
    borderRadius: '10px',
    padding: '18px 20px',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  category: {
    fontWeight: 600,
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    color: '#555',
    padding: '3px 10px',
    borderRadius: 99,
  },
  time: {
    fontSize: 13,
    color: '#aaa',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.7,
    margin: '4px 0 0 0',
  },
};

export default HistoryPage;