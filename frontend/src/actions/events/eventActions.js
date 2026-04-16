import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

function normalizeReminderValue(reminder) {
  const reminderText = String(reminder ?? "").trim();
  if (!reminderText) return null;

  const onlyDigits = reminderText.split("").every((char) => char >= "0" && char <= "9");
  if (onlyDigits) return `${reminderText} km`;

  return reminderText;
}

export async function createEvent({ partName, date, reminder }) {
  const carId = localStorage.getItem("selected_car_id");
  if (!carId) throw new Error("Nincs kiválasztott autó.");

  const dateIso = date && date.includes("T") ? date : `${date}T00:00:00Z`;
  const reminderValue = normalizeReminderValue(reminder);

  const response = await fetch(apiUrl("/events/create/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      car_id: Number(carId),
      title: partName || null,
      date: dateIso,
      reminder: reminderValue,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült létrehozni az eseményt.");
  }

  return data;
}

export async function getEvents() {
  const carId = localStorage.getItem("selected_car_id");
  const url = carId ? apiUrl(`/events/?car_id=${carId}`) : apiUrl("/events/");

  const response = await fetch(url, {
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült lekérdezni az eseményeket.");
  }

  return (data.events || []).map((item) => ({
    id: item.event_id,
    title: item.title || "Esemény",
    date: item.date,
    reminder: item.reminder || null,
  }));
}

export async function updateEvent(eventId, { partName, date, reminder }) {
  if (!eventId) throw new Error("Hiányzik az esemény azonosító.");

  const dateIso = date && date.includes("T") ? date : `${date}T00:00:00Z`;
  const reminderValue = normalizeReminderValue(reminder);

  const response = await fetch(apiUrl(`/events/${eventId}/`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      title: partName || null,
      date: dateIso,
      reminder: reminderValue,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült módosítani az eseményt.");
  }

  return data?.event || null;
}

export async function deleteEvent(eventId) {
  if (!eventId) throw new Error("Hiányzik az esemény azonosító.");

  const response = await fetch(apiUrl(`/events/${eventId}/delete/`), {
    method: "DELETE",
    headers: { Authorization: authHeaders().Authorization },
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült törölni az eseményt.");
  }

  return true;
}
