import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonResponse, createLocalStorageMock, getLastFetchBody } from "../shared/testHelpers";

vi.mock("../gasStations/gasStationActions", function() {
  return {
    createGasStation: vi.fn().mockResolvedValue(99),
  };
});

import { createGasStation } from "../gasStations/gasStationActions";
import { saveFueling, saveNewGasStation, saveTripWithFuelings } from "./tripActions";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({
    token: "secret-token",
    selected_car_id: "14",
  });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
  vi.clearAllMocks();
});

describe("saveFueling", function() {
  it("létrehoz egy tankolást alapértelmezett kilométeróra értékkel", async function() {
    fetch.mockResolvedValue(createJsonResponse({ fueling_id: 25 }));

    await expect(
      saveFueling({
        liters: "40",
        pricePerLiter: "620",
        supplier: "MOL",
        fuelTypeId: "2",
      }),
    ).resolves.toEqual({ ok: true, fuelingId: 25 });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/fuelings/create/",
      expect.objectContaining({ method: "POST" }),
    );
    expect(getLastFetchBody()).toEqual({
      car_id: 14,
      date: expect.any(String),
      liters: 40,
      price_per_liter: 620,
      supplier: "MOL",
      odometer_km: 0,
      fuel_type_id: 2,
    });
  });
});

describe("saveTripWithFuelings", function() {
  it("létrehozza a címeket, az utat, az úthasználatot és hozzárendeli a tankolásokat", async function() {
    fetch
      .mockResolvedValueOnce(createJsonResponse({ address_id: 101 }))
      .mockResolvedValueOnce(createJsonResponse({ address_id: 102 }))
      .mockResolvedValueOnce(createJsonResponse({ route_id: 103 }))
      .mockResolvedValueOnce(createJsonResponse({ route_usage_id: 104 }))
      .mockResolvedValueOnce(createJsonResponse({ fueling: { fueling_id: 8 } }));

    await expect(
      saveTripWithFuelings({
        from: "Budapest",
        to: "Pecs",
        startTime: "08:15",
        runtime: { actualArrival: "10:45" },
        arrivalDeltaMin: 3,
        distanceKm: 220,
        fuelings: [{ fuelingId: 8 }],
      }),
    ).resolves.toEqual({ ok: true, routeUsageId: 104 });

    expect(fetch).toHaveBeenCalledTimes(5);
    expect(fetch.mock.calls[0][0]).toBe("http://localhost:8000/api/addresses/create/");
    expect(fetch.mock.calls[1][0]).toBe("http://localhost:8000/api/addresses/create/");
    expect(fetch.mock.calls[2][0]).toBe("http://localhost:8000/api/routes/create/");
    expect(fetch.mock.calls[3][0]).toBe("http://localhost:8000/api/route-usage/create/");
    expect(fetch.mock.calls[4][0]).toBe("http://localhost:8000/api/fuelings/8/");
  });
});

describe("saveNewGasStation", function() {
  it("átadja a benzinkút létrehozását a közös műveletnek", async function() {
    await expect(saveNewGasStation({ name: "Shell" })).resolves.toEqual({ ok: true });

    expect(createGasStation).toHaveBeenCalledWith({ name: "Shell", car_id: 14 });
  });
});
