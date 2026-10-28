import jsQR from "jsqr";

/** Decode a QR code from RGBA pixel data using jsQR's polarity fallback. */
export function decodeQrPixels(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): string | undefined {
  if (width <= 0 || height <= 0 || data.length < width * height * 4) return undefined;

  return jsQR(new Uint8ClampedArray(data), width, height, {
    inversionAttempts: "attemptBoth",
  })?.data;
}
