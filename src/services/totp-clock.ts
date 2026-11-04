import { useSyncExternalStore } from "react";
import { TOTP_CLOCK_REFRESH_INTERVAL_MS } from "../constants/ui";

type ClockListener = () => void;

let currentTime = Date.now();
let intervalId: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<ClockListener>();

let lastNotifiedSecond = Math.floor(currentTime / 1000);

function notifyListeners() {
  currentTime = Date.now();
  const currentSecond = Math.floor(currentTime / 1000);

  // Keep the 250ms clock cadence for boundary accuracy, but notify React
  // subscribers only when the second used by the OTP/countdown display changes.
  if (currentSecond === lastNotifiedSecond) return;
  lastNotifiedSecond = currentSecond;

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
  return currentTime;
}

/** Shared TOTP clock. Subscribers rerender independently; no account-list parent state. */
export function useTotpClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
