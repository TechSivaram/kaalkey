/** Builds accessibility labels for the account card's actions. */
export function getAccountCardAccessibilityLabels(issuer: string) {
  return {
    viewQr: `View QR code for ${issuer}`,
    edit: `Edit ${issuer} account`,
    remove: `Remove ${issuer} account`,
    copyCode: `Copy verification code for ${issuer}`,
  };
}

/** Returns the uppercase initial displayed in an account card's icon. */
export function getAccountIssuerInitial(issuer: string): string {
  return issuer.slice(0, 1).toUpperCase();
}
