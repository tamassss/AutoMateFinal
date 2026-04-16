import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";
import { hasValue } from "../shared/valueChecks";

// Autók listázása
export async function getCars() {
  const response = await fetch(apiUrl("/cars/"), {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) return [];

  return data.cars ?? [];
}

// Új autó
export async function createCar(carData) {
  const payload = {
    license_plate: carData.license_plate,
    brand: carData.brand,
    model: carData.model,
    car_image: carData.car_image || null,
  };

  if (hasValue(carData.odometer_km)) {
    payload.odometer_km = Number(carData.odometer_km);
  }

  if (hasValue(carData.average_consumption)) {
    payload.average_consumption = Number(carData.average_consumption);
  }

  const response = await fetch(apiUrl("/cars/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    const error = new Error(data.detail || "Nem sikerült létrehozni az autót.");
    error.fieldErrors = data.field_errors || {};
    throw error;
  }

  return data;
}

// Autó módosítása
export async function editCar(carId, carData) {
  const payload = {};

  if (carData.license_plate !== undefined) payload.license_plate = carData.license_plate;
  if (carData.brand !== undefined) payload.brand = carData.brand;
  if (carData.model !== undefined) payload.model = carData.model;
  if (carData.car_image !== undefined) payload.car_image = carData.car_image;

  if (hasValue(carData.odometer_km)) {
    payload.odometer_km = Number(carData.odometer_km);
  } else if (!hasValue(carData.odometer_km)) {
    payload.odometer_km = null;
  }

  if (hasValue(carData.average_consumption)) {
    payload.average_consumption = Number(carData.average_consumption);
  } else if (!hasValue(carData.average_consumption)) {
    payload.average_consumption = null;
  }

  const response = await fetch(apiUrl(`/cars/${carId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    const error = new Error(data.detail || "Nem sikerült módosítani az autót.");
    error.fieldErrors = data.field_errors || {};
    throw error;
  }

  return data;
}

// Autó törlése
export async function deleteCar(carId) {
  if (!carId) {
    throw new Error("Hiányzik az autó azonosítója.");
  }

  const response = await fetch(apiUrl(`/cars/${carId}/delete/`), {
    method: "DELETE",
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült törölni az autót.");
  }

  return true;
}

// Autó kiválasztása
export function returnSelectedCard(carId) {
  localStorage.setItem("selected_car_id", String(carId));
  return carId;
}
