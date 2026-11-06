/** iOS fallback; CameraView's live barcode callback handles the active scan flow. */
export async function scanCapturedQr(_uri: string): Promise<{ data: string }[]> {
  return [];
}
