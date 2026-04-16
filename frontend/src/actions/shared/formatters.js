// Dátum formázása YYYY. MM. DD.
export function formatDate(isoDate) {
  if (!isoDate) return "-";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}. ${month}. ${day}.`;
}

// yyyy-mm -> YYYY. MM.
export function formatMonth(monthKey) {
  if (!monthKey || !monthKey.includes("-")) return monthKey || "-";

  const [year, month] = monthKey.split("-");
  return `${year}. ${month}.`;
}

// mp -> hh:mm:ss
export function formatHmsFromSeconds(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

// Date -> hh:mm
export function formatHHMMFromDate(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Datum locale formában
export function formatDateLocale(isoDate, locale = "hu-HU") {
  if (!isoDate) return "-";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale);
}

// hhmm -> perc
export function hhmmToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return null;

  const [hours, minutes] = hhmm.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

// Számformázás
export function formatGroupedNumber(value, options = {}) {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (Number.isNaN(num)) return "-";

  const { decimals = null, trimTrailingZeros = false } = options;
  const hasFixedDecimals = Number.isInteger(decimals) && decimals >= 0;

  let raw = hasFixedDecimals ? num.toFixed(decimals) : String(num);
  if (!hasFixedDecimals && raw.includes("e")) {
    raw = num.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 20 });
  }

  const [intPartRaw, fractionRaw] = raw.split(".");
  const isNegative = intPartRaw.startsWith("-");
  const intPart = isNegative ? intPartRaw.slice(1) : intPartRaw;

  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const signedInt = isNegative ? `-${groupedInt}` : groupedInt;

  if (!fractionRaw) return signedInt;

  const fraction = trimTrailingZeros ? fractionRaw.replace(/0+$/, "") : fractionRaw;
  if (!fraction) return signedInt;

  return `${signedInt},${fraction}`;
}

// Pénzformázás
export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${formatGroupedNumber(Math.round(Number(value) || 0))} Ft`;
}
