import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFuelings } from "./fuelingActions";
import { createJsonResponse, createLocalStorageMock } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({
    token: "secret-token",
    selected_car_id: "2",
  });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
});

describe("fueling data normalization", function() {
  it("maps monthly fueling groups to the table format", async function() {
    fetch.mockResolvedValue(
      createJsonResponse({
        fuelings_by_month: [
          {
            month: "2026-03",
            items: [
              {
                fueling_id: 7,
                date: "2026-03-20T00:00:00Z",
                liters: "45.5",
                price_per_liter: "612",
                odometer_km: 123456,
                supplier: "MOL",
                fuel_type: { fuel_type_id: 3, name: "95" },
              },
            ],
          },
        ],
      }),
    );

    await expect(getFuelings()).resolves.toEqual([
      {
        month: "2026. 03.",
        items: [
          {
            id: 7,
            datum: "2026. 03. 20.",
            mennyiseg: 45.5,
            literft: 612,
            kmallas: 123456,
            supplier: "MOL",
            fuelTypeId: 3,
            fuelType: "95",
          },
        ],
      },
    ]);
  });
});
