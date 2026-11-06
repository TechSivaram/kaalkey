import { vibrate } from "./native";
import type { HapticFeedback, HapticKind } from "./types";

/** Android feedback patterns retained from the existing implementation. */
export const triggerHapticFeedback: HapticFeedback = (kind: HapticKind) => {
  const pattern = kind === "success" ? [0, 22, 45, 28] : kind === "warning" ? [0, 38, 55, 38] : 12;

  vibrate(pattern);
};

export type { HapticKind } from "./types";
