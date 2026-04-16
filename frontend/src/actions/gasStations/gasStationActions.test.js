import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGasStation, getGasStations } from "./gasStationActions";
import { createJsonResponse, createLocalStorageMock, getLastFetchBody } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({
    token: "secret-token",
    selected_car_id: "4",
  });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
});

describe("gas station data rules", function() {
  it("filters invalid cards and maps valid station data for the UI", async function() {
    fetch.mockResolvedValue(
      createJsonResponse({
        gas_station_cards: [
          {
            fueling_id: 1,
            date: "2026-03-21T00:00:00Z",
            price_per_liter: "619",
            supplier: "Shell",
            fuel_type: "95",
            fuel_type_id: 2,
            gas_station: {
              gas_station_id: 5,
              city: "Budapest",
              street: "Fo utca",
              house_number: "12",
              name: "Shell",
              postal_code: "1111",
            },
          },
          {
            fueling_id: 2,
            gas_station: {},
          },
        ],
      }),
    );

    await expect(getGasStations()).resolves.toEqual([
      {
        id: 1,
        datum: "2026. 03. 21.",
        helyseg: "Budapest",
        cim: "Fo utca 12",
        literft: 619,
        supplier: "Shell",
        fuelType: "95",
        fuelTypeId: 2,
        gasStationId: 5,
        fuelingId: 1,
        stationName: "Shell",
        stationCity: "Budapest",
        stationPostalCode: "1111",
        stationStreet: "Fo utca",
        stationHouseNumber: "12",
      },
    ]);
  });

  it("normalizes new gas station payload field names", async function() {
    fetch.mockResolvedValue(createJsonResponse({ gas_station_id: 15 }));

    await expect(
      createGasStation({
        car_id: 4,
        date: "2026-03-23T10:00:00Z",
        name: "MOL",
        city: "Gyor",
        postal_code: "9021",
        street: "Kossuth utca",
        house_number: "1",
        pricePerLiter: 620,
        supplier: "MOL",
        fuelTypeId: 2,
      }),
    ).resolves.toBe(15);

    expect(getLastFetchBody()).toEqual({
      car_id: 4,
      date: "2026-03-23T10:00:00Z",
      name: "MOL",
      city: "Gyor",
      postal_code: "9021",
      street: "Kossuth utca",
      house_number: "1",
      price_per_liter: 620,
      supplier: "MOL",
      fuel_type_id: 2,
    });
  });
});
