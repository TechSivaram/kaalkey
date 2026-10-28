/** Formats a six-digit authenticator code into its two display groups. */
export function formatAccountCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
