import type { AppLifecycleListener, AppLifecycleState, Unsubscribe } from "./types";

/** Browser lifecycle state based on document visibility. */
export function getCurrentAppState(): AppLifecycleState {
  if (typeof document === "undefined") return "unknown";
  return document.visibilityState === "visible" ? "active" : "background";
}

export function subscribeToAppState(listener: AppLifecycleListener): Unsubscribe {
  if (typeof document === "undefined") return () => {};

  const notify = () => {
    listener(getCurrentAppState() ?? "unknown");
  };

  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

export type { AppLifecycleListener, AppLifecycleState, Unsubscribe } from "./types";
