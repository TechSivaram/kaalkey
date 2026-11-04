import { useSyncExternalStore } from "react";
import { TOTP_CLOCK_REFRESH_INTERVAL_MS } from "../constants/ui";

type ClockListener = () => void;

let currentTime = Date.now();
let intervalId: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<ClockListener>();

function notifyListeners() {
  currentTime = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: ClockListener) {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentTime = Date.now();
    intervalId = setInterval(notifyListeners, TOTP_CLOCK_REFRESH_INTERVAL_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

function getSnapshot() {
  // Countdown and OTP display are second-granular; retain the 250ms clock
  // cadence while avoiding subscriber updates for unchanged displayed seconds.
  return Math.floor(currentTime / 1000) * 1000;
}

/** Shared TOTP clock. Subscribers rerender independently; no account-list parent state. */
export function useTotpClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
