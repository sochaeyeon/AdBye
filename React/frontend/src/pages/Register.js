import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Register.css";

import api from '../services/api';

function Register() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

const handleRegister = async (e) => {
  e.preventDefault();
  try {
    await api.post('/api/auth/register', { username: id, password: password, email: email });

    setIsSubmitted(true);

  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    alert('회원가입에 실패했습니다. 다시 시도해주세요.');
  }
};

  return (
    <div className="register-container">

      <div className="register-box">
        <h2>회원가입</h2>

        {!isSubmitted ? (
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="아이디"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          <input
              type="password"
              placeholder="비밀번호"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="email"
              placeholder="이메일 (선택)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">회원가입</button>
          </form>
        ) : (
          <p className="register-message">
            회원가입이 완료되었습니다!{" "}
            <Link to="/login">로그인 화면으로 이동</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;