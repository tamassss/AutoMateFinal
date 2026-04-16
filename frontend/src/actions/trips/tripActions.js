import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";
import { hhmmToMinutes } from "../shared/formatters";
import { hasValue } from "../shared/valueChecks";
import { createGasStation as createStandaloneGasStation } from "../gasStations/gasStationActions";

// Új város/cím létrehozása
async function createAddress(cityText) {
  const response = await fetch(apiUrl("/addresses/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ city: cityText }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Cím létrehozása sikertelen.");
  }

  return data.address_id;
}

// Új út
async function createRoute(fromAddressId, toAddressId) {
  const response = await fetch(apiUrl("/routes/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      from_address_id: fromAddressId,
      to_address_id: toAddressId,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Útvonal létrehozása sikertelen.");
  }

  return data.route_id;
}

// Út kötése autóhoz
async function createRouteUsage(carId, routeId, tripData) {
  const actualArrival = tripData?.runtime?.actualArrival || null;

  const response = await fetch(apiUrl("/route-usage/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      car_id: Number(carId),
      route_id: Number(routeId),
      date: new Date().toISOString(),
      departure_time: hhmmToMinutes(tripData?.startTime),
      arrival_time: hhmmToMinutes(actualArrival),
      arrival_delta_min: tripData?.arrivalDeltaMin ?? null,
      distance_km: tripData?.distanceKm ?? null,
      title: tripData?.title || null,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Út mentése sikertelen.");
  }

  return data.route_usage_id;
}

// Új tankolás létrehozása(sima)
async function createFueling(carId, fueling) {
  const fuelTypeId = fueling?.fuelTypeId ? Number(fueling.fuelTypeId) : null;

  let odometer = fueling?.odometerKm;
  if (!hasValue(odometer)) {
    odometer = 0;
  }

  const payload = {
    car_id: Number(carId),
    date: fueling?.date || new Date().toISOString(),
    liters: Number(fueling?.liters),
    price_per_liter: Number(fueling?.pricePerLiter),
    supplier: fueling?.supplier || null,
    odometer_km: Number(odometer),
  };

  if (fuelTypeId) {
    payload.fuel_type_id = fuelTypeId;
  }

  if (hasValue(fueling?.routeUsageId)) {
    payload.route_usage_id = Number(fueling.routeUsageId);
  }

  const response = await fetch(apiUrl("/fuelings/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Tankolás mentése sikertelen.");
  }

  return data.fueling_id;
}

// Útközbeni tankolás úthoz utólag
async function assignFuelingToRouteUsage(fuelingId, routeUsageId) {
  const response = await fetch(apiUrl(`/fuelings/${fuelingId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      route_usage_id: Number(routeUsageId),
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Tankolás útvonalhoz kapcsolása sikertelen.");
  }

  return data?.fueling || null;
}

// Út mentése és tankolások kapcsolása
export async function saveTripWithFuelings(tripData) {
  const carId = tripData?.carId || localStorage.getItem("selected_car_id");
  if (!carId) throw new Error("Nincs kiválasztott autó.");

  const fromAddressId = await createAddress(tripData?.from || "Ismeretlen");
  const toAddressId = await createAddress(tripData?.to || "Ismeretlen");
  const routeId = await createRoute(fromAddressId, toAddressId);

  const routeUsageId = await createRouteUsage(carId, routeId, tripData);

  const fuelings = tripData?.fuelings || [];

  for (const fueling of fuelings) {
    if (!fueling?.fuelingId) {
      continue;
    }

    await assignFuelingToRouteUsage(fueling.fuelingId, routeUsageId);
  }

  return { ok: true, routeUsageId };
}

// Tankolás mentése (sima)
export async function saveFueling(fuelData, carIdOverride = null) {
  const carId = carIdOverride || localStorage.getItem("selected_car_id");
  if (!carId) throw new Error("Nincs kiválasztott autó.");

  const fuelingId = await createFueling(carId, fuelData || {});

  return { ok: true, fuelingId };
}

// Új benzinkút
export async function saveNewGasStation(gasStationData) {
  const carId = localStorage.getItem("selected_car_id");
  if (!carId) throw new Error("Nincs kiválasztott autó.");

  await createStandaloneGasStation({
    ...(gasStationData || {}),
    car_id: Number(carId),
  });

  return { ok: true };
}
