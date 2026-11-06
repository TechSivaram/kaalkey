import type { ViewStyle } from "react-native";

export type ScannerCameraProps = {
  /** Whether the live camera scanner should be active. Used by Web. */
  active: boolean;
  /** Called when a QR payload is detected. */
  onDetected: (data: string) => void;
  /** Native camera ref, ignored by Web. */
  cameraRef: any;
  style: ViewStyle;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onBarcodeScanned?: (event: { data: string }) => void;
  enableTorch?: boolean;
};
