import { useState } from "react";
import { apiFetch } from "../utils/apiFetch.js";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Login() {
const authExpired =
  typeof window !== "undefined" &&
  window.location.search.includes("reason=expired");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", res.status);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Redirect (later we use React Router)
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6">
        
        <h1 className="text-xl font-bold mb-4 text-center">
          Sign in to your account
        </h1>
{authExpired && (
  <div style={{
    marginBottom: "12px",
    padding: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    textAlign: "center",
  }}>
    Your session has expired. Please sign in again.
  </div>
)}
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <form
  onSubmit={(e) => {
    console.log("FORM SUBMITTED");
    handleLogin(e);
  }}
  className="space-y-4"
>
          <input
            autoComplete="off"
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg"
            value={email}
            onChange={(e) => {
              console.log("Email changed to:", e.target.value);
              setEmail(e.target.value);
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
  type="submit"
  onClick={() => console.log("BUTTON CLICKED")}
  className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold"
>
  Sign In
</button>
        </form>
        <p className="mt-3 text-sm text-center">
  <Link to="/password-reset" className="text-blue-600 hover:underline">
    Forgot your password?
  </Link>
</p>
      </div>
    </div>
  );
}
