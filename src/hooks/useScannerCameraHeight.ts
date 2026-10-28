import { useWindowDimensions } from "react-native";
import { getScannerCameraHeight } from "../utils/scannerCameraHeight";

/** Keeps the QR scanner preview height responsive to the available window height. */
export function useScannerCameraHeight() {
  const { height: windowHeight } = useWindowDimensions();
  return getScannerCameraHeight(windowHeight);
}
