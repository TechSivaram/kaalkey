import { CameraView } from "expo-camera";
import type { ViewStyle } from "react-native";

type Props = {
  cameraRef: any;
  style: ViewStyle;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onBarcodeScanned?: (event: { data: string }) => void;
  enableTorch?: boolean;
};

/** iOS-only camera component using the native CameraView barcode callback. */
export default function NativeQrCamera({
  cameraRef,
  style,
  onCameraReady,
  onMountError,
  onBarcodeScanned,
  enableTorch,
}: Props) {
  return (
    <CameraView
      ref={cameraRef}
      style={style}
      facing="back"
      enableTorch={enableTorch}
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      onCameraReady={onCameraReady}
      onMountError={onMountError}
      onBarcodeScanned={onBarcodeScanned}
    />
  );
}
