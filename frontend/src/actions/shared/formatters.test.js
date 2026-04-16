import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatGroupedNumber,
  formatHHMMFromDate,
  formatHmsFromSeconds,
  formatMoney,
  formatMonth,
  hhmmToMinutes,
} from "./formatters";

describe("formatDate", function() {
  it("megformázza az ISO dátumot", function() {
    expect(formatDate("2026-03-21T00:00:00Z")).toBe("2026. 03. 21.");
  });

  it("kötőjelet ad vissza hibás dátumra", function() {
    expect(formatDate("hiba")).toBe("-");
  });
});

describe("formatMonth", function() {
  it("megformázza a hónap kulcsot", function() {
    expect(formatMonth("2026-03")).toBe("2026. 03.");
  });
});

describe("formatHmsFromSeconds", function() {
  it("hh:mm:ss formára alakít", function() {
    expect(formatHmsFromSeconds(3661)).toBe("01:01:01");
  });
});

describe("formatHHMMFromDate", function() {
  it("hh:mm formára alakít", function() {
    const date = new Date(2026, 2, 21, 9, 5);
    expect(formatHHMMFromDate(date)).toBe("09:05");
  });
});

describe("hhmmToMinutes", function() {
  it("percre alakítja a hh:mm értéket", function() {
    expect(hhmmToMinutes("02:30")).toBe(150);
  });

  it("null-t ad vissza hibás inputra", function() {
    expect(hhmmToMinutes("hiba")).toBe(null);
  });
});

describe("formatGroupedNumber", function() {
  it("ezres tagolással formáz", function() {
    expect(formatGroupedNumber(1234567)).toBe("1.234.567");
  });

  it("kezeli a tizedeseket", function() {
    expect(formatGroupedNumber(1234.5, { decimals: 2 })).toBe("1.234,50");
  });

  it("kötőjelet ad vissza üres értékre", function() {
    expect(formatGroupedNumber("")).toBe("-");
  });
});

describe("formatMoney", function() {
  it("forintként formáz", function() {
    expect(formatMoney(1234)).toBe("1.234 Ft");
  });
});
