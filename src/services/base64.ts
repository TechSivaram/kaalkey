/** Decode a Base64 string into bytes without relying on browser-only atob(). */
export function decodeBase64ToBytes(base64: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const output = new Uint8Array(
    Math.floor((clean.length * 3) / 4) - (clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0),
  );
  let outIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = alphabet.indexOf(clean[i] || "A");
    const b = alphabet.indexOf(clean[i + 1] || "A");
    const c = alphabet.indexOf(clean[i + 2] || "A");
    const d = alphabet.indexOf(clean[i + 3] || "A");
    const chunk = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
    if (outIndex < output.length) output[outIndex++] = (chunk >> 16) & 255;
    if (outIndex < output.length) output[outIndex++] = (chunk >> 8) & 255;
    if (outIndex < output.length) output[outIndex++] = chunk & 255;
  }
  return output;
}
