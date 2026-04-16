// Szöveg hossz korlátozása
export function limitTextLength(value, maxLength) {
  if (value == null) return "";
  const normalized = normalizeWhitespace(value);
  return normalized.slice(0, maxLength);
}

// Szám bemeneti értékének korlátozása
export function clampNumberInput(value, options = {}) {
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  const integer = options.integer ?? false;
  const allowEmpty = options.allowEmpty ?? true;
  const decimals = options.decimals ?? null;

  const raw = String(value ?? "").trim();
  
  if (raw === "") {
    return allowValueEmpty(allowEmpty, min);
  }

  // , -> .
  const normalized = raw.replace(",", ".");
  let num = Number(normalized);

  // nem szám -> üres / minimum
  if (Number.isNaN(num)) {
    return allowValueEmpty(allowEmpty, min);
  }

  // min > x < max
  let clamped = Math.min(Math.max(num, min), max);

  // kerekítés / tizedesjegyek
  if (integer) {
    clamped = Math.round(clamped);
  } else if (typeof decimals === "number" && decimals >= 0) {
    clamped = Number(clamped.toFixed(decimals));
  }

  return String(clamped);
}

//rendszám formátummá alakítás
export function normalizeLicensePlateInput(value) {
  return String(value ?? "")
    .toUpperCase()
    .slice(0, 8);
}

//rendszám formáttum ellenőrzés
export function isValidLicensePlate(value) {
  return /^[A-Z]{3,4}-\d{3}$/.test(String(value ?? "").trim());
}

//whitespace levágás
export function normalizeWhitespace(value) {
  return String(value ?? "").trim();
}

// nem szám -> üres / minimum
function allowValueEmpty(allowEmpty, min) {
  return allowEmpty ? "" : String(min === Number.NEGATIVE_INFINITY ? 0 : min);
}
