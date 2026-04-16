import { vi } from "vitest";

export function createLocalStorageMock(initialValues = {}) {
  const store = new Map(
    Object.entries(initialValues).map(function([key, value]) {
      return [key, String(value)];
    }),
  );

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

export function createJsonResponse(data, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(data),
  };
}

export function getLastFetchBody() {
  const call = globalThis.fetch.mock.calls.at(-1);
  return JSON.parse(call?.[1]?.body ?? "{}");
}
