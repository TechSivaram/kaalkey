import { CameraView } from "expo-camera";
import type { ScannerCameraProps } from "./types";

/** Shared Expo CameraView implementation for Android and iOS. */
export default function NativeScannerCamera({
  cameraRef,
  style,
  onCameraReady,
  onMountError,
  onBarcodeScanned,
  enableTorch,
  facing = "back",
}: ScannerCameraProps) {
  return (
    <CameraView
      ref={cameraRef}
      style={style}
      facing={facing}
      enableTorch={enableTorch}
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      onCameraReady={onCameraReady}
      onMountError={onMountError}
      onBarcodeScanned={onBarcodeScanned}
    />
  );
}
