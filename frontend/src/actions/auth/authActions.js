import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

// Bejelentkezés (+token)
export async function login(email, password) {
  const response = await fetch(apiUrl("/auth/login/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Hibás bejelentkezési adatok.");
    }
    throw new Error(data.detail || "Hiba a bejelentkezésnél.");
  }

  // adatok mentése ls-be
  localStorage.setItem("token", data?.tokens?.access || "");
  localStorage.setItem("refresh", data?.tokens?.refresh || "");
  localStorage.setItem("full_name", data?.user?.full_name || "");
  localStorage.setItem("email", (email || "").trim());
  localStorage.setItem("password", password || "");
  localStorage.setItem("role", data?.user?.role || "user");
  localStorage.setItem("user_id", String(data?.user?.user_id || ""));

  return data.user;
}

// Regisztrálás
export async function register(email, password, fullName) {
  const response = await fetch(apiUrl("/auth/register/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
    }),
  });

  const data = await parseJsonSafe(response);

  // hibaüzenetek
  if (!response.ok) {
    const emailError = Array.isArray(data?.email) ? data.email[0] : data?.email;
    const detail = data?.detail;
    const nonFieldError = Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : data?.non_field_errors;

    throw new Error(emailError || detail || nonFieldError || "Hiba a regisztrációnál.");
  }

  return data;
}

// Profiladatok módosítása
export async function updateProfileSettings({ fullName, email, password }) {
  const response = await fetch(apiUrl("/auth/profile/"), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Hiba a beállítások mentése közben.");
  }

  // ls adatok frissítése
  localStorage.setItem("full_name", data?.user?.full_name || fullName || "");
  localStorage.setItem("email", data?.user?.email || email || "");
  localStorage.setItem("password", password || "");
  localStorage.setItem("role", data?.user?.role || localStorage.getItem("role") || "user");

  return data?.user || null;
}
