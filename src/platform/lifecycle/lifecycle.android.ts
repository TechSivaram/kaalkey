/**
 * Platform entry point. Android and iOS currently share React Native AppState.
 * Keep separate files for future platform-specific lifecycle behavior.
 */
export { getCurrentAppState, subscribeToAppState } from "./native";
export type { AppLifecycleListener, AppLifecycleState, Unsubscribe } from "./types";
