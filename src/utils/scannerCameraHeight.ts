import {
  ACCOUNT_SCANNER_HEIGHT_MAX,
  ACCOUNT_SCANNER_HEIGHT_MIN,
  ACCOUNT_SCANNER_HEIGHT_RATIO,
} from "../constants/ui";

/** Calculates a bounded scanner preview height from the available window height. */
export function getScannerCameraHeight(windowHeight: number): number {
  return Math.min(
    ACCOUNT_SCANNER_HEIGHT_MAX,
    Math.max(ACCOUNT_SCANNER_HEIGHT_MIN, Math.round(windowHeight * ACCOUNT_SCANNER_HEIGHT_RATIO)),
  );
}
