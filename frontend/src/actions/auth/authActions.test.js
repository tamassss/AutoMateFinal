import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, updateProfileSettings } from "./authActions";
import { createJsonResponse, createLocalStorageMock, getLastFetchBody } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock({ token: "secret-token", role: "user" });
  globalThis.window = { location: { href: "/" } };
  globalThis.fetch = vi.fn();
});

describe("auth session state", function() {
  it("stores the authenticated user metadata after login", async function() {
    fetch.mockResolvedValue(
      createJsonResponse({
        tokens: { access: "access-token", refresh: "refresh-token" },
        user: { user_id: 8, full_name: "Test User", role: "admin" },
      }),
    );

    const result = await login("test@example.com", "secret");

    expect(getLastFetchBody()).toEqual({
      email: "test@example.com",
      password: "secret",
    });
    expect(localStorage.getItem("token")).toBe("access-token");
    expect(localStorage.getItem("refresh")).toBe("refresh-token");
    expect(localStorage.getItem("full_name")).toBe("Test User");
    expect(localStorage.getItem("role")).toBe("admin");
    expect(localStorage.getItem("user_id")).toBe("8");
    expect(result).toEqual({ user_id: 8, full_name: "Test User", role: "admin" });
  });

  it("refreshes local profile metadata after settings are saved", async function() {
    fetch.mockResolvedValue(
      createJsonResponse({
        user: {
          full_name: "Updated Name",
          email: "updated@example.com",
          role: "moderator",
        },
      }),
    );

    const result = await updateProfileSettings({
      fullName: "Updated Name",
      email: "updated@example.com",
      password: "new-secret",
    });

    expect(localStorage.getItem("full_name")).toBe("Updated Name");
    expect(localStorage.getItem("email")).toBe("updated@example.com");
    expect(localStorage.getItem("password")).toBe("new-secret");
    expect(localStorage.getItem("role")).toBe("moderator");
    expect(result).toEqual({
      full_name: "Updated Name",
      email: "updated@example.com",
      role: "moderator",
    });
  });
});
