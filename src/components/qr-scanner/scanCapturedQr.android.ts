/**
 * Legacy Android still-image scanner helper retained for compatibility.
 * The recovered live scanner uses CameraView.onBarcodeScanned directly,
 * so this helper intentionally does not invoke a separate image-scanning API.
 */
export async function scanCapturedQr(_uri: string): Promise<{ data: string }[]> {
  return [];
}
