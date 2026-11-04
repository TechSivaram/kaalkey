import { AppState, type AppStateStatus } from "react-native";
import { useSyncExternalStore } from "react";
import { TOTP_CLOCK_REFRESH_INTERVAL_MS } from "../constants/ui";

type ClockListener = () => void;

let currentTime = Date.now();
let intervalId: ReturnType<typeof setInterval> | undefined;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | undefined;
const listeners = new Set<ClockListener>();
let lastNotifiedSecond = Math.floor(currentTime / 1000);

function isForeground(state: AppStateStatus | null) {
  // A null initial state is treated as foreground (notably during web startup).
  return state === null || state === "active" || state === "unknown";
}

function stopClock() {
  if (intervalId !== undefined) {
    clearInterval(intervalId);
    intervalId = undefined;
  }
}

function notifyListeners() {
  currentTime = Date.now();
  const currentSecond = Math.floor(currentTime / 1000);

  // The 250ms cadence keeps boundary timing accurate, but React subscribers
  // only need a notification when the displayed second changes.
  if (currentSecond === lastNotifiedSecond) return;
  lastNotifiedSecond = currentSecond;
  listeners.forEach((listener) => listener());
}

function startClock() {
  if (intervalId !== undefined || listeners.size === 0 || !isForeground(AppState.currentState)) {
    return;
  }

  currentTime = Date.now();
  lastNotifiedSecond = Math.floor(currentTime / 1000);
  intervalId = setInterval(notifyListeners, TOTP_CLOCK_REFRESH_INTERVAL_MS);
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== "active") {
    stopClock();
    return;
  }

  // Refresh immediately on resume so OTPs/countdowns never continue from a
  // stale background timestamp, even if the app was suspended for minutes.
  currentTime = Date.now();
  lastNotifiedSecond = Math.floor(currentTime / 1000);
  listeners.forEach((listener) => listener());
  startClock();
}

function subscribe(listener: ClockListener) {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentTime = Date.now();
    lastNotifiedSecond = Math.floor(currentTime / 1000);
    appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
    startClock();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      stopClock();
      appStateSubscription?.remove();
      appStateSubscription = undefined;
    }
  };
}

function getSnapshot() {
  return currentTime;
}

/** Shared foreground-only TOTP clock; subscribers update independently. */
export function useTotpClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
