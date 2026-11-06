import { vibrate } from "./native";
import type { HapticFeedback, HapticKind } from "./types";

/** iOS vibration durations retained from the existing implementation. */
export const triggerHapticFeedback: HapticFeedback = (kind: HapticKind) => {
  const duration = kind === "success" ? 35 : kind === "warning" ? 45 : 15;

  vibrate(duration);
};

export type { HapticKind } from "./types";
