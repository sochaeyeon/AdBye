import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import About from "./pages/About";

import Home from "./pages/Home";
import ReviewApp from "./ReviewApp";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ContactUser from "./pages/ContactUser";
import Layout from "./layouts/Layout";
import Admin from "./admins/Admin";
import AdminLayout from "./admins/AdminLayout";
import UserLayout from "./users/UserLayout";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route index element={<Home />} />
        <Route path="review" element={<ReviewApp />} />
        <Route path="/" element={<Layout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="about" element={<About />} />
        </Route>

        <Route path="/user" element={<UserLayout />}>
          <Route path="inquiry" element={<ContactUser />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Admin />}>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;