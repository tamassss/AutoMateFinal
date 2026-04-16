import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

// Dashboard adatok lekérése
export async function getDashboard() {
  const carId = localStorage.getItem("selected_car_id");
  const url = carId ? apiUrl(`/dashboard/?car_id=${carId}`) : apiUrl("/dashboard/");

  const response = await fetch(url, {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérni a dashboard adatokat.");
  }

  return data;
}

