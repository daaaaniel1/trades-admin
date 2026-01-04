import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleRegister() {
    setError("");

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          businessName,
          tradeType,
        }),
      });

      const data = await res.json();

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">
          Create your account
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="text"
          placeholder="Business name"
          className="w-full p-3 border rounded-lg"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Trade type (e.g. Plumber)"
          className="w-full p-3 border rounded-lg"
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
        />

        <button
          type="button"
          onClick={handleRegister}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold"
        >
          Create account
        </button>
      </div>
    </div>
  );
}