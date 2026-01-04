import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate();

        useEffect(() => {
          const token = localStorage.getItem("token");
          const isHome = window.location.pathname === "/";

          if (token && isHome) {
            navigate("/dashboard");
          }
        }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold">Trades App</h1>

        <p className="text-sm text-gray-600">
          Track income and expenses for your trade business.
        </p>

        <Link
          to="/login"
          className="block w-full bg-blue-600 text-white p-3 rounded-lg font-semibold"
        >
          Sign in
        </Link>

        <Link
          to="/register"
          className="block w-full border border-gray-300 text-gray-700 p-3 rounded-lg font-semibold"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}