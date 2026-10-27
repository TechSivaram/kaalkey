import { useWindowDimensions } from "react-native";
import {
  ACCOUNT_SCANNER_HEIGHT_MAX,
  ACCOUNT_SCANNER_HEIGHT_MIN,
  ACCOUNT_SCANNER_HEIGHT_RATIO,
} from "../constants/ui";

/** Keeps the QR scanner preview height responsive to the available window height. */
export function useScannerCameraHeight() {
  const { height: windowHeight } = useWindowDimensions();

  return Math.min(
    ACCOUNT_SCANNER_HEIGHT_MAX,
    Math.max(
      ACCOUNT_SCANNER_HEIGHT_MIN,
      Math.round(windowHeight * ACCOUNT_SCANNER_HEIGHT_RATIO),
    ),
  );
}
