import jsQR from "jsqr";

/** Decode a QR code from RGBA pixel data using jsQR's polarity fallback. */
export function decodeQrPixels(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): string | undefined {
  if (width <= 0 || height <= 0 || data.length < width * height * 4) return undefined;

  // Canvas ImageData and the cropped fallback are already clamped arrays.
  // Reuse them directly; copying full-resolution RGBA buffers can be expensive.
  const pixels =
    data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);

  return jsQR(pixels, width, height, {
    inversionAttempts: "attemptBoth",
  })?.data;
}
