/**
 * Generic fallback. Platform builds resolve back-handler.android.ts,
 * back-handler.ios.ts, or back-handler.web.ts automatically.
 */
import type { HardwareBackPressHandler, Unsubscribe } from "./types";

export function subscribeToHardwareBackPress(_handler: HardwareBackPressHandler): Unsubscribe {
  return () => {};
}

export type { HardwareBackPressHandler, Unsubscribe } from "./types";
