import { getCurrentAppState, subscribeToAppState } from "../platform/lifecycle/lifecycle";
import type { AppLifecycleState } from "../platform/lifecycle/types";
import { useCallback, useSyncExternalStore } from "react";

type ClockListener = () => void;
type TimeStepGroup = {
  listeners: Set<ClockListener>;
  lastStep: number;
};

let currentTime = Date.now();
let timeoutId: ReturnType<typeof setTimeout> | undefined;
let unsubscribeAppState: (() => void) | undefined;
const listeners = new Set<ClockListener>();
const timeStepGroups = new Map<number, TimeStepGroup>();
let lastNotifiedSecond = Math.floor(currentTime / 1000);

function isForeground(state: AppLifecycleState) {
  // A null initial state is treated as foreground (notably during web startup).
  return state === null || state === "active" || state === "unknown";
}

function hasSubscribers() {
  return listeners.size > 0 || timeStepGroups.size > 0;
}

function getTimeStep(periodSeconds: number) {
  return Math.floor(currentTime / (periodSeconds * 1000));
}

function stopClock() {
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
}

// Schedule one update at the next wall-clock second boundary instead of
// polling four times per second. This keeps countdown labels accurate while
// reducing idle timer wakeups by 75% when the vault is visible.
function scheduleNextTick() {
  if (timeoutId !== undefined || !hasSubscribers() || !isForeground(getCurrentAppState())) {
    return;
  }

  const delay = Math.max(16, 1000 - (Date.now() % 1000));
  timeoutId = setTimeout(() => {
    timeoutId = undefined;
    notifyListeners();
    scheduleNextTick();
  }, delay);
}

function notifyTimeStepGroups() {
  // Check each distinct period once, then notify only accounts whose OTP step
  // actually changed. A vault with many accounts on the same period therefore
  // has one clock-level check instead of one React subscription callback per account.
  for (const [periodSeconds, group] of timeStepGroups) {
    const nextStep = getTimeStep(periodSeconds);
    if (nextStep === group.lastStep) continue;
    group.lastStep = nextStep;
    group.listeners.forEach((listener) => listener());
  }
}

function notifyListeners() {
  currentTime = Date.now();
  const currentSecond = Math.floor(currentTime / 1000);

  // Subscribers only need a notification when the displayed second changes.
  if (currentSecond === lastNotifiedSecond) return;
  lastNotifiedSecond = currentSecond;
  listeners.forEach((listener) => listener());
  notifyTimeStepGroups();
}

function startClock() {
  if (timeoutId !== undefined || !hasSubscribers() || !isForeground(getCurrentAppState())) {
    return;
  }

  currentTime = Date.now();
  lastNotifiedSecond = Math.floor(currentTime / 1000);
  // Establish a fresh baseline when the clock starts; the post-subscribe
  // snapshot check in useSyncExternalStore observes the current step.
  for (const [periodSeconds, group] of timeStepGroups) {
    group.lastStep = getTimeStep(periodSeconds);
  }
  scheduleNextTick();
}

function ensureClock() {
  if (!unsubscribeAppState) {
    unsubscribeAppState = subscribeToAppState(handleAppStateChange);
  }
  startClock();
}

function cleanupClockIfUnused() {
  if (hasSubscribers()) return;
  stopClock();
  unsubscribeAppState?.();
  unsubscribeAppState = undefined;
}

function handleAppStateChange(nextState: AppLifecycleState) {
  if (nextState !== "active") {
    stopClock();
    return;
  }

  // Refresh immediately on resume so OTPs/countdowns never continue from a
  // stale background timestamp, even if the app was suspended for minutes.
  currentTime = Date.now();
  lastNotifiedSecond = Math.floor(currentTime / 1000);
  listeners.forEach((listener) => listener());
  notifyTimeStepGroups();
  scheduleNextTick();
}

function subscribe(listener: ClockListener) {
  listeners.add(listener);
  ensureClock();

  return () => {
    listeners.delete(listener);
    cleanupClockIfUnused();
  };
}

function subscribeToTimeStep(periodSeconds: number, listener: ClockListener) {
  let group = timeStepGroups.get(periodSeconds);
  if (!group) {
    group = { listeners: new Set(), lastStep: getTimeStep(periodSeconds) };
    timeStepGroups.set(periodSeconds, group);
  }
  group.listeners.add(listener);
  ensureClock();

  return () => {
    const currentGroup = timeStepGroups.get(periodSeconds);
    if (currentGroup) {
      currentGroup.listeners.delete(listener);
      if (currentGroup.listeners.size === 0) timeStepGroups.delete(periodSeconds);
    }
    cleanupClockIfUnused();
  };
}

function getSnapshot() {
  return currentTime;
}

/** Shared foreground-only TOTP clock; subscribers update independently. */
export function useTotpClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Subscribe by period so OTP displays update only when their code can change. */
export function useTotpTimeStep(periodSeconds: number) {
  const normalizedPeriod = Math.max(1, periodSeconds);
  const subscribeForPeriod = useCallback(
    (listener: ClockListener) => subscribeToTimeStep(normalizedPeriod, listener),
    [normalizedPeriod],
  );
  const getPeriodSnapshot = useCallback(() => getTimeStep(normalizedPeriod), [normalizedPeriod]);
  return useSyncExternalStore(subscribeForPeriod, getPeriodSnapshot, getPeriodSnapshot);
}
