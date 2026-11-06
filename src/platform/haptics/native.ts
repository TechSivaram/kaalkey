import { Vibration } from "react-native";

/**
 * Shared native vibration primitive.
 * Platform-specific modules choose the vibration pattern or duration.
 */
export function vibrate(pattern: number | number[]): void {
  Vibration.vibrate(pattern);
}
