import { beforeEach, describe, expect, it } from "vitest";
import { getCurrentUserMeta } from "./communityLocalActions";
import { createLocalStorageMock } from "../shared/testHelpers";

beforeEach(function() {
  globalThis.localStorage = createLocalStorageMock();
});

describe("community user metadata", function() {
  it("reads the current user metadata from local storage", function() {
    localStorage.setItem("user_id", "15");
    localStorage.setItem("full_name", "Test User");
    localStorage.setItem("role", "admin");

    expect(getCurrentUserMeta()).toEqual({
      userId: "15",
      fullName: "Test User",
      role: "admin",
    });
  });

  it("uses safe defaults when metadata is missing", function() {
    expect(getCurrentUserMeta()).toEqual({
      userId: "",
      fullName: "Felhasználó",
      role: "user",
    });
  });
});
