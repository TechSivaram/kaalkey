/**
 * Generic fallback for tooling or runtimes without platform-specific resolution.
 */
export { getCurrentAppState, subscribeToAppState } from "./native";
export type { AppLifecycleListener, AppLifecycleState, Unsubscribe } from "./types";
