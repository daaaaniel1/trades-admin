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
  return (
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
  );
}

// force rebuild
