/** Shared haptic feedback kinds used across platforms. */
export type HapticKind = "selection" | "success" | "warning";

export type HapticFeedback = (kind: HapticKind) => void;
