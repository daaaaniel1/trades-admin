import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import PasswordResetRequest from "./pages/PasswordResetRequest";
import PasswordResetConfirm from "./pages/PasswordResetConfirm";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard.jsx";
import IncomeList from "./pages/IncomeList.jsx";
import ExpensesList from "./pages/ExpensesList.jsx";

export default function App() {

const [authExpired, setAuthExpired] = useState(false);

// expose a global handler for apiFetch errors
window.__onAuthRequired = () => setAuthExpired(true);
return (
  <>
    {authExpired && (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "12px",
        background: "#fee2e2",
        color: "#991b1b",
        textAlign: "center",
        zIndex: 1000,
      }}>
        Session expired. Please log in again.
        <button
          style={{ marginLeft: "12px" }}
          onClick={() => (window.location.href = "/login")}
        >
          Login
        </button>
      </div>
    )}

    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/password-reset" element={<PasswordResetRequest />} />
      <Route path="/password-reset/:token" element={<PasswordResetConfirm />} />
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/income" element={<IncomeList />} />
      <Route path="/expenses" element={<ExpensesList />} />
    </Routes>
  </>
);
}
