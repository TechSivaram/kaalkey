import * as OTPAuth from "otpauth";
import type { Account } from "../types/account";
import { normalizeBase32Secret } from "../utils/base32";

export function generateCode(account: Account): string {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.name,
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
      secret: normalizeBase32Secret(account.secret),
    });

    return totp.generate();
  } catch {
    return "------";
  }
}
