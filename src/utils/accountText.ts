/**
 * Normalizes account identity text for case-insensitive comparisons.
 * Callers choose whether to trim so existing matching behavior stays explicit.
 */
export function normalizeAccountText(value: string, trim = false): string {
  const text = trim ? value.trim() : value;
  return text.toLocaleLowerCase();
}
