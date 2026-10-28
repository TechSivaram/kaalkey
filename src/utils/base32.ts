/** Removes separators and padding from a Base32 secret and uppercases it. */
export function normalizeBase32Secret(value: string): string {
  return value.replace(/[\s-]/g, "").replace(/=+$/g, "").toUpperCase();
}

/** Checks the Base32 alphabet and rejects impossible padding lengths. */
export function isValidBase32Secret(value: string): boolean {
  const secret = normalizeBase32Secret(value);
  return /^[A-Z2-7]+$/.test(secret) && secret.length % 8 !== 1;
}
