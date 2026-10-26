type Props = {
  cameraRef: any;
  style: any;
  onCameraReady: () => void;
  onMountError: (event: { message: string }) => void;
  onBarcodeScanned?: (event: { data: string }) => void;
};

/** Web scanning is handled by WebQrScanner; this native-camera component is intentionally empty. */
export default function NativeQrCamera(_props: Props) {
  return null;
}
