const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("spend_token") || "";
}

export async function api(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function saveSession(data) {
  localStorage.setItem("spend_token", data.token);
  localStorage.setItem("spend_user", JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem("spend_token");
  localStorage.removeItem("spend_user");
}

export function updateStoredUser(user) {
  localStorage.setItem("spend_user", JSON.stringify(user));
}
