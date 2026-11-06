import type { HapticFeedback } from "./types";

/** Haptic feedback is unavailable in the current browser implementation. */
export const triggerHapticFeedback: HapticFeedback = () => {};
export type { HapticKind } from "./types";
