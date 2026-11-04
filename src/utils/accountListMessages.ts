/** Text helpers for account-list status and count labels. */
export function getAccountCountLabel(count: number): string {
  return count === 1 ? "ACCOUNT" : "ACCOUNTS";
}
