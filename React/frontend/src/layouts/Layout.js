import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import "../App.css";

function Layout() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("로그아웃되었습니다.");
    navigate("/");
  };

  return (
    <div className="app">
      <header className="header-top">
        <div
          className="logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          re:view
        </div>
        <nav className="nav-menu">
          {isLoggedIn ? (
            <a href="/" onClick={handleLogout}>
              <img src="/login.png" alt="Logout" />
              로그아웃
            </a>
          ) : (
            <Link to="/login">
              <img src="/login.png" alt="Login" />
              로그인
            </Link>
          )}
          <Link to={"/user/inquiry"}>
            <img src="/contact.png" alt="Inquiries" />
            문의하기
          </Link>
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;