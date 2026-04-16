import { beforeEach, describe, expect, it, vi } from "vitest";
import { createServiceLogEntry, getServiceLog, updateServiceLogEntry } from "./serviceLogActions";
import { createJsonResponse, createLocalStorageMock, getLastFetchBody } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({
    token: "secret-token",
    selected_car_id: "3",
  });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
});

describe("service log business rules", function() {
  it("maps service rows and splits combined reminders", async function() {
    fetch.mockResolvedValue(
      createJsonResponse({
        service_log: [
          {
            maintenance_id: 4,
            part_name: "Olajszuro",
            date: "2026-03-21T00:00:00Z",
            cost: 12345,
            reminder: "2026-06-01 | 5000 km",
            service_center: { service_center_id: 8 },
          },
        ],
      }),
    );

    await expect(getServiceLog()).resolves.toEqual([
      {
        id: 4,
        alkatresz: "Olajszuro",
        ido: "2026. 03. 21.",
        ar: "12.345 Ft",
        rawDate: "2026-03-21T00:00:00Z",
        rawCost: 12345,
        rawReminder: "2026-06-01 | 5000 km",
        serviceCenterId: 8,
        emlekeztetoDatum: "2026-06-01",
        emlekeztetoKm: "5000 km",
      },
    ]);
  });

  it("builds a maintenance entry after creating the service center", async function() {
    fetch
      .mockResolvedValueOnce(createJsonResponse({ service_center_id: 10 }))
      .mockResolvedValueOnce(createJsonResponse({ maintenance_id: 20 }));

    await createServiceLogEntry({
      partName: "Olajcsere",
      date: "2026-03-21",
      cost: "14990",
      reminderDate: "2026-06-01",
      reminderKm: "5000",
      serviceCenterName: "Proba Szerviz",
    });

    const secondBody = JSON.parse(fetch.mock.calls[1][1].body);
    expect(secondBody).toEqual({
      car_id: 3,
      service_center_id: 10,
      date: "2026-03-21T00:00:00Z",
      part_name: "Olajcsere",
      cost: 14990,
      reminder: "2026-06-01 | 5000 km",
    });
  });

  it("uses null for empty cost and keeps kilometer-only reminders", async function() {
    fetch.mockResolvedValue(createJsonResponse({ maintenance: { maintenance_id: 6 } }));

    await updateServiceLogEntry(6, {
      partName: "Szuro",
      date: "2026-03-25",
      cost: "",
      reminderDate: "",
      reminderKm: "7000",
    });

    expect(getLastFetchBody()).toEqual({
      part_name: "Szuro",
      date: "2026-03-25T00:00:00Z",
      cost: null,
      reminder: "7000 km",
    });
  });
});
