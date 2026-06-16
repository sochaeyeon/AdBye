import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Contact.css";
import api from '../services/api'; 

function ContactUser() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const navigate = useNavigate();
  const hasRun = useRef(false);

  const username = localStorage.getItem("username");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const token = localStorage.getItem("token");

    if (!token || !username) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    api.get(`/api/inquiries/user/${username}`)
      .then((res) => setInquiries(res.data))
      .catch((err) => console.error(err));
  }, [username, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !content) return;

    const inquiry = { username, title, content };

    api.post("/api/inquiries", inquiry)
      .then((res) => {
        setInquiries([...inquiries, res.data]);
        setTitle("");
        setContent("");
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (id) => {
    if (window.confirm("정말로 이 문의를 삭제하시겠습니까?")) {
      api.delete(`/api/inquiries/${id}`, {
        params: { username: username }
      })
      .then(() => {
        alert("문의가 삭제되었습니다.");
        setInquiries(inquiries.filter((inq) => inq.id !== id));
      })
      .catch((err) => {
        console.error(err);
        alert("삭제 권한이 없거나 오류가 발생했습니다.");
      });
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-box">
        <h2>문의하기</h2>
        <form onSubmit={handleSubmit}>
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>

          <button type="submit">작성하기</button>
        </form>
      </div>

      <div className="inquiry-list">
        <h3>나의 문의 내역</h3>
        <ul>
          {inquiries.map((item, index) => (
            <li key={item.id}>
              <strong>
                {index + 1}. {item.title}
              </strong>
              {item.username === username && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="delete-btn-inline"
                  style={{ marginLeft: "10px" }}
                >
                  삭제
                </button>
              )}
              <br />
              문의: {item.content} <br />
              답변: {item.answer ? item.answer : "아직 답변이 없습니다."}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ContactUser;
