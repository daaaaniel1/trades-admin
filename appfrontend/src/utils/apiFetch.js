export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const API_BASE = "/api";

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
if (res.status === 401 || res.status === 403) {
  // Non-destructive auth handling:
  // - keep token
  // - let caller decide what to do
  const err = new Error("Authentication required");
  err.code = "AUTH_REQUIRED";
  throw err;
}
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res;
}
