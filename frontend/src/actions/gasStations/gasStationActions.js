import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";
import { formatDate } from "../shared/formatters";

// Benzinkút címének összeállítása (utca + házszám)
function buildAddress(gasStation) {
  if (!gasStation) return "-";

  const parts = [gasStation.street, gasStation.house_number].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");

  return gasStation.name || "-";
}

// Benzinkút kártyák lekérése
export async function getGasStations() {
  const carId = localStorage.getItem("selected_car_id");
  const url = carId ? apiUrl(`/gas-stations/?car_id=${carId}`) : apiUrl("/gas-stations/");

  const response = await fetch(url, {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni a benzinkutakat.");
  }

  const items = data.gas_station_cards ?? [];

  return items
    .filter((item) => item?.gas_station?.gas_station_id)
    .map((item) => ({
      id: item.fueling_id,
      datum: formatDate(item.date),
      helyseg: item.gas_station?.city || "-",
      cim: buildAddress(item.gas_station),
      literft: Number(item.price_per_liter || 0),
      supplier: item.supplier || "",
      fuelType: item.fuel_type || "-",
      fuelTypeId: item.fuel_type_id || "",
      gasStationId: item.gas_station?.gas_station_id || null,
      fuelingId: item.fueling_id || null,
      stationName: item.gas_station?.name || "",
      stationCity: item.gas_station?.city || "",
      stationPostalCode: item.gas_station?.postal_code || "",
      stationStreet: item.gas_station?.street || "",
      stationHouseNumber: item.gas_station?.house_number || "",
    }));
}

// Új benzinkút
export async function createGasStation(gasStationData) {
  const response = await fetch(apiUrl("/gas-stations/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      car_id: gasStationData?.car_id ?? null,
      date: gasStationData?.date ?? null,
      name: gasStationData?.name ?? null,
      city: gasStationData?.city ?? null,
      postal_code: gasStationData?.postal_code ?? null,
      street: gasStationData?.street ?? null,
      house_number: gasStationData?.house_number ?? null,
      price_per_liter: gasStationData?.price_per_liter ?? gasStationData?.pricePerLiter ?? null,
      supplier: gasStationData?.supplier ?? null,
      fuel_type_id: gasStationData?.fuel_type_id ?? gasStationData?.fuelTypeId ?? null,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült létrehozni a benzinkutat.");
  }

  return data?.gas_station_id || null;
}

// Benzinkút módosítása
export async function editGasStation(gasStationId, gasStationData) {
  if (!gasStationId) {
    throw new Error("Hiányzik a benzinkút azonosító.");
  }

  const response = await fetch(apiUrl(`/gas-stations/${gasStationId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      car_id: localStorage.getItem("selected_car_id") || null,
      date: gasStationData?.date ?? null,
      name: gasStationData?.name ?? null,
      city: gasStationData?.city ?? null,
      postal_code: gasStationData?.postal_code ?? null,
      street: gasStationData?.street ?? null,
      house_number: gasStationData?.house_number ?? null,
      price_per_liter: gasStationData?.price_per_liter ?? gasStationData?.pricePerLiter ?? null,
      supplier: gasStationData?.supplier ?? null,
      fuel_type_id: gasStationData?.fuel_type_id ?? gasStationData?.fuelTypeId ?? null,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült módosítani a benzinkutat.");
  }

  return data?.gas_station || null;
}

// Tankolás módosítása
export async function editFuelingById(fuelingId, fuelingData) {
  if (!fuelingId) {
    throw new Error("Hiányzik a tankolás azonosítója.");
  }

  const response = await fetch(apiUrl(`/fuelings/${fuelingId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      price_per_liter: fuelingData?.price_per_liter,
      supplier: fuelingData?.supplier ?? null,
      fuel_type_id: fuelingData?.fuel_type_id ?? null,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült módosítani a tankolást.");
  }

  return data?.fueling || null;
}

// Benzinkút törlése
export async function deleteGasStation(gasStationId) {
  if (!gasStationId) {
    throw new Error("Hiányzik a benzinkút azonosító.");
  }

  const response = await fetch(apiUrl(`/gas-stations/${gasStationId}/delete/`), {
    method: "DELETE",
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült törölni a benzinkutat.");
  }

  return true;
}
