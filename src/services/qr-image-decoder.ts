import jsQR from "jsqr";

/** Decode a QR code from RGBA pixel data using jsQR's polarity fallback. */
export function decodeQrPixels(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): string | undefined {
  if (width <= 0 || height <= 0 || data.length < width * height * 4) return undefined;

  // Canvas ImageData and the cropped fallback are already clamped arrays.
  // For jpeg-js Uint8Array output, create a clamped view over the same buffer
  // instead of copying every RGBA byte into a second full-resolution allocation.
  const pixels =
    data instanceof Uint8ClampedArray
      ? data
      : new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);

  return jsQR(pixels, width, height, {
    inversionAttempts: "attemptBoth",
  })?.data;
}
