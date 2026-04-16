// Limit lekérése (lS)
export function getStoredBudgetLimit() {
  const carId = localStorage.getItem("selected_car_id") || "default";
  const rawValue = localStorage.getItem(`budget_limit_${carId}`);
  const parsedValue = Number(rawValue);

  if (!rawValue || Number.isNaN(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

// Limit mentése (lS)
export function setStoredBudgetLimit(limitValue) {
  const carId = localStorage.getItem("selected_car_id") || "default";
  const safeValue = Math.max(0, Number(limitValue) || 0);

  localStorage.setItem(`budget_limit_${carId}`, String(safeValue));

  return safeValue;
}

