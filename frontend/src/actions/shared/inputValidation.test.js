import { describe, expect, it } from "vitest";
import {
  clampNumberInput,
  isValidLicensePlate,
  limitTextLength,
  normalizeLicensePlateInput,
} from "./inputValidation";

describe("limitTextLength", function() {
  it("levágja a túl hosszú szöveget", function() {
    expect(limitTextLength("abcdef", 3)).toBe("abc");
  });

  it("üres stringet ad vissza null értékre", function() {
    expect(limitTextLength(null, 3)).toBe("");
  });
});

describe("clampNumberInput", function() {
  it("üres stringet ad vissza üres inputra", function() {
    expect(clampNumberInput("")).toBe("");
  });

  it("a minimumra korlátozza a kisebb értéket", function() {
    expect(clampNumberInput("-5", { min: 0 })).toBe("0");
  });

  it("a maximumra korlátozza a nagyobb értéket", function() {
    expect(clampNumberInput("150", { max: 100 })).toBe("100");
  });

  it("kerekíti az integer értéket", function() {
    expect(clampNumberInput("12.6", { integer: true })).toBe("13");
  });

  it("kezeli a vesszős tizedes inputot", function() {
    expect(clampNumberInput("6,55", { decimals: 2 })).toBe("6.55");
  });
});

describe("normalizeLicensePlateInput", function() {
  it("nagybetűsre alakítja a rendszámot", function() {
    expect(normalizeLicensePlateInput("abc-123")).toBe("ABC-123");
  });

  it("maximum 8 karakterre vág", function() {
    expect(normalizeLicensePlateInput("ABCDE-12345")).toBe("ABCDE-12");
  });
});

describe("isValidLicensePlate", function() {
  it("elfogadja a 3 betű + 3 szám formátumot", function() {
    expect(isValidLicensePlate("ABC-123")).toBe(true);
  });

  it("elfogadja a 4 betű + 3 szám formátumot", function() {
    expect(isValidLicensePlate("ABCD-123")).toBe(true);
  });

  it("elutasítja a hibás formátumot", function() {
    expect(isValidLicensePlate("AB-123")).toBe(false);
  });
});
