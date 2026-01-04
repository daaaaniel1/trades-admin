export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      const token = localStorage.getItem("token");

      if (token) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }

      throw new Error("Authentication required");
    }

    let errorMessage = "Request failed";
    try {
      const data = await res.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(errorMessage);
  }

  return res;
}