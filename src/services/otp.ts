import * as OTPAuth from "otpauth";
import type { Account } from "../types/account";
import { normalizeBase32Secret } from "../utils/base32";

type CachedTotp = {
  fingerprint: string;
  instance: OTPAuth.TOTP;
};

// Account objects are replaced when saved, so WeakMap entries naturally expire
// with their account. The fingerprint also protects against in-place edits.
const TOTP_INSTANCE_CACHE = new WeakMap<Account, CachedTotp>();

function getTotpInstance(account: Account): OTPAuth.TOTP {
  const fingerprint = [
    account.issuer,
    account.name,
    account.algorithm,
    account.digits,
    account.period,
    account.secret,
  ].join("\\u0000");
  const cached = TOTP_INSTANCE_CACHE.get(account);

  if (cached?.fingerprint === fingerprint) return cached.instance;

  const instance = new OTPAuth.TOTP({
    issuer: account.issuer,
    label: account.name,
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
    secret: normalizeBase32Secret(account.secret),
  });

  TOTP_INSTANCE_CACHE.set(account, { fingerprint, instance });
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
