import type { Account } from "../types/account";
import { normalizeAccountText } from "../utils/accountText";
import { normalizeBase32Secret } from "../utils/base32";

/** Creates a normalized identity used to detect equivalent imported accounts. */
export function getAccountIdentity(account: Account): string {
  return [
    normalizeAccountText(account.issuer, true),
    normalizeAccountText(account.name, true),
    normalizeBase32Secret(account.secret),
    account.algorithm,
    String(account.digits),
    String(account.period),
  ].join("|");
}
