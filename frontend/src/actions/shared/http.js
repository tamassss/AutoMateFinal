const API_BASE_URL = "http://localhost:8000/api";

// API útvonal összerakás
export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

// Auth header tokennel
export function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// kijelentkezés (401 status)
export function handleUnauthorized(response) {
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = "/";
    throw new Error("Lejárt a belépés. Jelentkezz be újra.");
  }
}

// json().catch()
export async function parseJsonSafe(response) {
  return response.json().catch(() => ({}));
}

