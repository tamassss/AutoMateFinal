import { apiUrl, authHeaders, handleUnauthorized, parseJsonSafe } from "../shared/http";

// Új Út becslés
export async function estimateRoute(fromText, toText, avgConsumption) {
  const response = await fetch(apiUrl("/routes/estimate/"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      from_text: fromText,
      to_text: toText,
      avg_consumption: avgConsumption,
    }),
  });

  const data = await parseJsonSafe(response);
  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.detail || "Nem sikerült útvonalat számolni.");
  }

  return data;
}