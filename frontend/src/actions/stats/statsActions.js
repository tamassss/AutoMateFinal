import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

// Általános statisztikák lekérése (1 autó)
export async function getGeneralStats() {
  const carId = localStorage.getItem("selected_car_id");
  const url = carId ? apiUrl(`/statistics/general/?car_id=${carId}`) : apiUrl("/statistics/general/");

  const response = await fetch(url, {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérni az általános statisztikákat.");
  }

  return data;
}

// Összesített statisztikák (összes autó)
export async function getSummaryStats() {
  const response = await fetch(apiUrl("/statistics/summary/"), {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérni az összesített statisztikákat.");
  }

  return data.summary ?? [];
}