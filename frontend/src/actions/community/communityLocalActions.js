import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

// Aktuális felhasználó adatainak lekérése ls-ből
export function getCurrentUserMeta() {
  return {
    userId: String(localStorage.getItem("user_id") || ""),
    fullName: String(localStorage.getItem("full_name") || "Felhasználó"),
    role: String(localStorage.getItem("role") || "user"),
  };
}

// Közösségi rész engedélyezve van-e
export async function isCommunityEnabledForCar(_userId, carId) {
  if (!carId) return false;
  const response = await fetch(apiUrl(`/community/settings/?car_id=${carId}`), {
    headers: { Authorization: authHeaders().Authorization },
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) return false;
  return !!data.enabled;
}

// Közösségi rész be-kikapcsolása
export async function setCommunityEnabledForCar(_userId, carId, enabled) {
  const response = await fetch(apiUrl("/community/settings/"), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ car_id: Number(carId), enabled: !!enabled }),
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült menteni a közösség állapotát.");
  }
  return !!data.enabled;
}

// Teljes közösségi csomag lekérése (saját profil, mások profiljai és állapot)
export async function getCommunityProfilesPayload(carId) {
  if (!carId) return { enabled: false, my_profile: null, profiles: [] };
  const response = await fetch(apiUrl(`/community/profiles/?car_id=${carId}`), {
    headers: { Authorization: authHeaders().Authorization },
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni a közösségi profilokat.");
  }
  return {
    enabled: !!data.enabled,
    my_profile: data.my_profile || null,
    profiles: data.profiles || [],
  };
}

// Új benzinkút-megosztási kérelem indítása
export async function createShareRequest({ carId, gasStation }) {
  const response = await fetch(apiUrl("/community/share-requests/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      car_id: Number(carId),
      gas_station_id: Number(gasStation?.gasStationId),
    }),
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült létrehozni a megosztási kérelmet.");
  }
  return data;
}

// Meglévő megosztási kérelem visszavonása
export async function revokeShareRequest({ carId, gasStationId }) {
  const response = await fetch(apiUrl("/community/share-requests/revoke/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      car_id: Number(carId),
      gas_station_id: Number(gasStationId),
    }),
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült visszavonni a megosztási kérelmet.");
  }
  return data;
}

// Az összes benzinkút megosztási állapotának lekérése az adott autóhoz
export async function getShareStatusesByCar(carId) {
  const response = await fetch(apiUrl(`/community/share-requests/statuses/?car_id=${carId}`), {
    headers: { Authorization: authHeaders().Authorization },
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) return {};
  const out = {};
  for (const item of data.statuses || []) {
    out[Number(item.gas_station_id)] = item.status;
  }
  return out;
}

// Függőben lévő megosztási kérelmek lekérése (moderátori funkció)
export async function getPendingShareRequests() {
  const response = await fetch(apiUrl("/community/share-requests/pending/"), {
    headers: { Authorization: authHeaders().Authorization },
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni a várólistát.");
  }
  return data.pending || [];
}

// Megosztási kérelem elbírálása (elfogadás/elutasítás)
export async function reviewShareRequest(requestId, decision) {
  const response = await fetch(apiUrl(`/community/share-requests/${requestId}/review/`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ decision }),
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült elbírálni a kérelmet.");
  }
  return data;
}

// A jóváhagyott benzinkutak lekérése
export async function getApprovedSharedStations() {
  const response = await fetch(apiUrl("/community/shared-stations/"), {
    headers: { Authorization: authHeaders().Authorization },
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni a megosztott benzinkutakat.");
  }
  return data.shared_stations || [];
}

// Megosztott benzinkút törlése (moderátori funkció)
export async function moderatorDeleteSharedStation(requestId) {
  const response = await fetch(apiUrl(`/community/share-requests/${requestId}/`), {
    method: "DELETE",
    headers: { Authorization: authHeaders().Authorization },
  });
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült törölni a megosztott benzinkutat.");
  }
  return true;
}

// Havi statisztikai összehasonlítás lekérése két autó/felhasználó között
export async function getCommunityMonthlyComparison({ carId, otherUserId, otherCarId }) {
  const response = await fetch(
    apiUrl(
      `/community/compare-monthly/?car_id=${Number(carId)}&other_user_id=${Number(otherUserId)}&other_car_id=${Number(otherCarId)}`
    ),
    {
      headers: { Authorization: authHeaders().Authorization },
    }
  );
  const data = await parseJsonSafe(response);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni az összehasonlító statisztikákat.");
  }
  return data;
}
