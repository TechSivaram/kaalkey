import { AppState } from "react-native";
import type { AppLifecycleListener, AppLifecycleState, Unsubscribe } from "./types";

/** Native Android/iOS lifecycle backed by React Native AppState. */
export function getCurrentAppState(): AppLifecycleState {
  return AppState.currentState;
}

export function subscribeToAppState(listener: AppLifecycleListener): Unsubscribe {
  const subscription = AppState.addEventListener("change", listener);
  return () => subscription.remove();
}
