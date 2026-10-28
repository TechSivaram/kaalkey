/** Maps browser camera startup failures to actionable scanner messages. */
export function getWebQrCameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  return name === "NotAllowedError"
    ? "Camera permission denied. Allow camera access in browser settings, then reopen the scanner."
    : name === "NotFoundError"
      ? "No camera was found on this device."
      : name === "NotReadableError"
        ? "The camera is busy in another app or browser tab."
        : "Could not start camera. Use HTTPS or localhost and check browser permissions.";
}
