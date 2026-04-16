import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

// Felhasználók lekérése
export async function getAdminUsers(email = "") {
  const q = (email || "").trim();
  const url = q ? apiUrl(`/admin/users/?email=${encodeURIComponent(q)}`) : apiUrl("/admin/users/");

  const response = await fetch(url, {
    headers: authHeaders(),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérni a felhasználókat.");
  }

  return data.users || [];
}

// Felhasználó módosítása
export async function updateAdminUser(userId, payload) {
  if (!userId) {
    throw new Error("Hiányzik a felhasználó azonosítója.");
  }

  const response = await fetch(apiUrl(`/admin/users/${userId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült módosítani a felhasználót.");
  }

  return data.user || null;
}

// Felhasználó törlése
export async function deleteAdminUser(userId) {
  if (!userId) {
    throw new Error("Hiányzik a felhasználó azonosítója.");
  }

  const response = await fetch(apiUrl(`/admin/users/${userId}/delete/`), {
    method: "DELETE",
    headers: authHeaders(),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült törölni a felhasználót.");
  }

  return true;
}