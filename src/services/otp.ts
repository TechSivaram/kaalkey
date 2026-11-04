import * as OTPAuth from "otpauth";
import type { Account } from "../types/account";
import { normalizeBase32Secret } from "../utils/base32";

type CachedTotp = {
  issuer: string;
  name: string;
  algorithm: Account["algorithm"];
  digits: number;
  period: number;
  secret: string;
  instance: OTPAuth.TOTP;
};

// Account objects are replaced when saved, so WeakMap entries naturally expire
// with their account. Field comparisons also protect against in-place edits.
const TOTP_INSTANCE_CACHE = new WeakMap<Account, CachedTotp>();

function getTotpInstance(account: Account): OTPAuth.TOTP {
  const cached = TOTP_INSTANCE_CACHE.get(account);

  // Compare the primitive configuration fields directly. This avoids building
  // a temporary array and fingerprint string on every OTP refresh, while
  // still detecting in-place account edits.
  if (
    cached &&
    cached.issuer === account.issuer &&
    cached.name === account.name &&
    cached.algorithm === account.algorithm &&
    cached.digits === account.digits &&
    cached.period === account.period &&
    cached.secret === account.secret
  ) {
    return cached.instance;
  }

  const instance = new OTPAuth.TOTP({
    issuer: account.issuer,
    label: account.name,
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
    secret: normalizeBase32Secret(account.secret),
  });

  TOTP_INSTANCE_CACHE.set(account, {
    issuer: account.issuer,
    name: account.name,
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
    secret: account.secret,
    instance,
  });
  return instance;
}

export function generateCode(account: Account, timestamp?: number): string {
  try {
    const totp = getTotpInstance(account);
    return totp.generate(timestamp === undefined ? undefined : { timestamp });
  } catch {
    return "------";
  }
}
