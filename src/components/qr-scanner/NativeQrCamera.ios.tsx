import { CameraView } from "expo-camera";
import type { ViewStyle } from "react-native";

type Props = {
  cameraRef: any;
  style: ViewStyle;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onBarcodeScanned?: (event: { data: string }) => void;
};

/** iOS-only camera component, isolated from Android's fallback frame scanning. */
export default function NativeQrCamera({
  cameraRef,
  style,
  onCameraReady,
  onMountError,
  onBarcodeScanned,
}: Props) {
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
