/** Android-only fallback; iOS uses CameraView's live barcode callback. */
export async function scanCapturedQr(_uri: string): Promise<{ data: string }[]> {
  return [];
}
