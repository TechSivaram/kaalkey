import type { HardwareBackPressHandler, Unsubscribe } from "./types";

/**
 * No hardware Back subscription is needed on this platform.
 * Navigation gestures and browser history remain owned by Expo Router/the browser.
 */
export function subscribeToHardwareBackPress(_handler: HardwareBackPressHandler): Unsubscribe {
  return () => {};
}

export type { HardwareBackPressHandler, Unsubscribe } from "./types";
