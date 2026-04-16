let pendingRequests = 0;
const listeners = new Set();

// értesíti a feliratkozókat hogy mennyi fetch van folyamatban
function notify() {
  for (const listener of listeners) {
    listener(pendingRequests);
  }
}

// komponens -> feliratkozó
export function subscribeLoading(listener) {
  listeners.add(listener);
  listener(pendingRequests);
  return function() {
    listeners.delete(listener);
  };
}

// Növeli a függőben lévő kérések számát
function inc() {
  pendingRequests += 1;
  notify();
}

// Csökkenti a függőben lévő kérések számát
function dec() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  notify();
}

// globális fetch -> minden fetch előtt növeli, utána csökkenti a számlálót
export function installFetchLoadingTracker() {
  if (typeof window === "undefined") return;
  if (window.__automateFetchPatched) return;

  const originalFetch = window.fetch.bind(window);
  window.__automateFetchPatched = true;

  // új fetch számlálóval
  window.fetch = async function(...args) {
    inc();
    try {
      return await originalFetch(...args);
    } finally {
      dec();
    }
  };
}