/** Text helpers for account-list status and count labels. */
export function getAccountCountLabel(count: number): string {
  return count === 1 ? "ACCOUNT" : "ACCOUNTS";
}

export function getAccountListStatusMessage(status: "loading" | "no-match"): string {
  return status === "loading" ? "Loading secure vault..." : "No accounts match your search.";
}
