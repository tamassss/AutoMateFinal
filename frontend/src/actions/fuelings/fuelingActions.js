import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";
import { formatDate, formatMonth } from "../shared/formatters";

// Tankolások lekérése
export async function getFuelings() {
  const carId = localStorage.getItem("selected_car_id");
  const url = carId ? apiUrl(`/fuelings/?car_id=${carId}`) : apiUrl("/fuelings/");

  const response = await fetch(url, {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni a tankolásokat.");
  }

  const groups = data.fuelings_by_month ?? [];

  return groups.map((group) => ({
    month: formatMonth(group.month),
    items: (group.items || []).map((fueling) => ({
      id: fueling.fueling_id,
      datum: formatDate(fueling.date),
      mennyiseg: Number(fueling.liters || 0),
      literft: Number(fueling.price_per_liter || 0),
      kmallas: Number(fueling.odometer_km) > 0 ? fueling.odometer_km : "-",
      supplier: fueling.supplier || "",
      fuelTypeId: fueling.fuel_type?.fuel_type_id || "",
      fuelType: fueling.fuel_type?.name || "-",
    })),
  }));
}

// Tankolás módosítása
export async function editFuel(fuelingId, fuelingData) {
  if (!fuelingId) {
    throw new Error("Hiányzik a tankolás azonosítója.");
  }

  const response = await fetch(apiUrl(`/fuelings/${fuelingId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      liters: fuelingData?.liters,
      price_per_liter: fuelingData?.price_per_liter,
      odometer_km: fuelingData?.odometer_km,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült módosítani a tankolást.");
  }

  return data?.fueling || null;
}

// Tankolás törlése
export async function deleteFuel(fuelingId) {
  if (!fuelingId) {
    throw new Error("Hiányzik a tankolás azonosítója.");
  }

  const response = await fetch(apiUrl(`/fuelings/${fuelingId}/delete/`), {
    method: "DELETE",
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült törölni a tankolást.");
  }

  return true;
}
