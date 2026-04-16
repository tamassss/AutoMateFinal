import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEvent, getEvents } from "./eventActions";
import { createJsonResponse, createLocalStorageMock, getLastFetchBody } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({
    token: "secret-token",
    selected_car_id: "11",
  });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
});

describe("event business rules", function() {
  it("normalizes date and numeric reminder before saving", async function() {
    fetch.mockResolvedValue(createJsonResponse({ ok: true }));

    await createEvent({
      partName: "Olajcsere",
      date: "2026-03-21",
      reminder: "1500",
    });

    expect(getLastFetchBody()).toEqual({
      car_id: 11,
      title: "Olajcsere",
      date: "2026-03-21T00:00:00Z",
      reminder: "1500 km",
    });
  });

  it("maps empty event titles to the default display name", async function() {
    fetch.mockResolvedValue(
      createJsonResponse({
        events: [
          {
            event_id: 3,
            title: "",
            date: "2026-03-21T00:00:00Z",
            reminder: "500 km",
          },
        ],
      }),
    );

    await expect(getEvents()).resolves.toEqual([
      {
        id: 3,
        title: "Esemény",
        date: "2026-03-21T00:00:00Z",
        reminder: "500 km",
      },
    ]);
  });
});
