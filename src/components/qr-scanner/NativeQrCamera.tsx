import { CameraView } from "expo-camera";
import type { ViewStyle } from "react-native";

/** Shared TypeScript declaration/fallback for the platform-specific camera files.
 * Metro selects NativeQrCamera.android.tsx, .ios.tsx, or .web.tsx at runtime.
 */
export type NativeQrCameraProps = {
  cameraRef: any;
  style: ViewStyle;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onBarcodeScanned?: (event: { data: string }) => void;
};

export default function NativeQrCamera({
  cameraRef,
  style,
  onCameraReady,
  onMountError,
  onBarcodeScanned,
}: NativeQrCameraProps) {
  return (
    <CameraView
      ref={cameraRef}
      style={style}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      onCameraReady={onCameraReady}
      onMountError={onMountError}
      onBarcodeScanned={onBarcodeScanned}
    />
  );
}
