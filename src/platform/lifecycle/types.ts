import type { AppStateStatus } from "react-native";

/** Normalized lifecycle state exposed by the platform adapter. */
export type AppLifecycleState = AppStateStatus | null;
export type AppLifecycleListener = (state: AppStateStatus) => void;
export type Unsubscribe = () => void;
