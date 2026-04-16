import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCar, editCar, returnSelectedCard } from "./carsActions";
import { createJsonResponse, createLocalStorageMock, getLastFetchBody } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({ token: "secret-token" });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
});

describe("car business rules", function() {
  it("converts optional numeric create fields before saving", async function() {
    fetch.mockResolvedValue(createJsonResponse({ ok: true }));

    await createCar({
      license_plate: "ABC-123",
      brand: "Ford",
      model: "Focus",
      car_image: "car_1",
      odometer_km: "123456",
      average_consumption: "6.7",
    });

    expect(getLastFetchBody()).toEqual({
      license_plate: "ABC-123",
      brand: "Ford",
      model: "Focus",
      car_image: "car_1",
      odometer_km: 123456,
      average_consumption: 6.7,
    });
  });

  it("sends null when optional numeric car fields are cleared", async function() {
    fetch.mockResolvedValue(createJsonResponse({ ok: true }));

    await editCar(5, {
      license_plate: "ABC-123",
      odometer_km: "",
      average_consumption: "",
    });

    expect(getLastFetchBody()).toEqual({
      license_plate: "ABC-123",
      odometer_km: null,
      average_consumption: null,
    });
  });

  it("stores the selected car id", function() {
    expect(returnSelectedCard(15)).toBe(15);
    expect(localStorage.getItem("selected_car_id")).toBe("15");
  });
});
