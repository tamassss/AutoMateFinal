import { beforeEach, describe, expect, it } from "vitest";
import { getStoredBudgetLimit, setStoredBudgetLimit } from "./budgetActions";

function createLocalStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock();
});

describe("getStoredBudgetLimit", function() {
  it("null értéket ad vissza, ha nincs eltárolt érték", function() {
    expect(getStoredBudgetLimit()).toBe(null);
  });

  it("visszaadja a kiválasztott autó eltárolt értékét", function() {
    localStorage.setItem("selected_car_id", "12");
    localStorage.setItem("budget_limit_12", "45000");

    expect(getStoredBudgetLimit()).toBe(45000);
  });

  it("null értéket ad vissza hibás eltárolt értéknél", function() {
    localStorage.setItem("selected_car_id", "12");
    localStorage.setItem("budget_limit_12", "abc");

    expect(getStoredBudgetLimit()).toBe(null);
  });
});

describe("setStoredBudgetLimit", function() {
  it("eltárolja a limitet a kiválasztott autóhoz", function() {
    localStorage.setItem("selected_car_id", "8");

    const result = setStoredBudgetLimit(12000);

    expect(result).toBe(12000);
    expect(localStorage.getItem("budget_limit_8")).toBe("12000");
  });

  it("nullára korlátozza a negatív értékeket", function() {
    const result = setStoredBudgetLimit(-5);

    expect(result).toBe(0);
    expect(localStorage.getItem("budget_limit_default")).toBe("0");
  });
});
