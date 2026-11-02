import { useSyncExternalStore } from "react";

type ActivitySnapshot = {
  active: boolean;
  message: string | null;
};

let manualActivityMessage: string | null = null;
let nextActivityId = 1;
const activeActivities = new Map<number, string | null>();
const activityListeners = new Set<() => void>();

let snapshot: ActivitySnapshot = { active: false, message: null };

function updateSnapshot(): void {
  const firstActivity = activeActivities.values().next();
  const trackedActivityActive = !firstActivity.done;
  const trackedActivityMessage = firstActivity.done ? null : firstActivity.value;
  snapshot = {
    active: manualActivityMessage !== null || trackedActivityActive,
    message: manualActivityMessage ?? trackedActivityMessage,
  };
  activityListeners.forEach((listener) => listener());
}

function subscribeToActivity(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

function getActivitySnapshot(): ActivitySnapshot {
  return snapshot;
}

/** Sets the legacy single activity message used by backup and QR workflows. */
export function setGlobalActivityMessage(message: string | null): void {
  if (manualActivityMessage === message) return;
  manualActivityMessage = message;
  updateSnapshot();
}

/**
 * Starts a tracked activity. Each returned completion function is idempotent,
 * so overlapping requests cannot hide the loader until all have completed.
 */
export function beginGlobalActivity(message: string | null = null): () => void {
  const activityId = nextActivityId++;
  activeActivities.set(activityId, message);
  updateSnapshot();

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    activeActivities.delete(activityId);
    updateSnapshot();
  };
}

export function useGlobalActivity(): ActivitySnapshot {
  return useSyncExternalStore(subscribeToActivity, getActivitySnapshot, getActivitySnapshot);
}
