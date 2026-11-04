/** Decode Base64 into bytes using a precomputed character lookup table. */
const BASE64_LOOKUP = (() => {
  const lookup = new Int16Array(128);
  lookup.fill(-1);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (let index = 0; index < alphabet.length; index += 1) {
    lookup[alphabet.charCodeAt(index)] = index;
  }
  return lookup;
})();

export function decodeBase64ToBytes(base64: string): Uint8Array {
  // Retain tolerance for whitespace and non-Base64 characters in input.
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const output = new Uint8Array(
    Math.floor((clean.length * 3) / 4) - (clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0),
  );
  let outIndex = 0;

  for (let index = 0; index < clean.length; index += 4) {
    const a = BASE64_LOOKUP[clean.charCodeAt(index)] ?? -1;
    const b = BASE64_LOOKUP[clean.charCodeAt(index + 1)] ?? -1;
    const c = BASE64_LOOKUP[clean.charCodeAt(index + 2)] ?? -1;
    const d = BASE64_LOOKUP[clean.charCodeAt(index + 3)] ?? -1;
    const chunk =
      ((a < 0 ? 0 : a) << 18) | ((b < 0 ? 0 : b) << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);

    if (outIndex < output.length) output[outIndex++] = (chunk >> 16) & 255;
    if (outIndex < output.length) output[outIndex++] = (chunk >> 8) & 255;
    if (outIndex < output.length) output[outIndex++] = chunk & 255;
  }

  return output;
}
