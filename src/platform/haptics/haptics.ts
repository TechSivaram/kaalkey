/**
 * Fallback for tooling or runtimes without platform-specific module resolution.
 * Avoid triggering native vibration from an unknown runtime.
 */
import type { HapticFeedback } from "./types";

export const triggerHapticFeedback: HapticFeedback = () => {};
export type { HapticKind } from "./types";
