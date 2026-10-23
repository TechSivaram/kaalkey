import * as OTPAuth from "otpauth";
import type { Account } from "../types/account";

export function normalizeBase32Secret(value: string): string {
  return value.replace(/[\s-]/g, "").replace(/=+$/g, "").toUpperCase();
}

export function isValidBase32Secret(value: string): boolean {
  const secret = normalizeBase32Secret(value);
  return /^[A-Z2-7]+$/.test(secret) && secret.length % 8 !== 1;
}

export function validateAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<Account>;
  if (
    typeof account.id !== "string" ||
    !account.id.trim() ||
    typeof account.issuer !== "string" ||
    !account.issuer.trim() ||
    typeof account.name !== "string" ||
    !account.name.trim() ||
    typeof account.secret !== "string" ||
    !isValidBase32Secret(account.secret) ||
    !["SHA1", "SHA256", "SHA512"].includes(account.algorithm ?? "") ||
    !Number.isInteger(account.digits) ||
    (account.digits ?? 0) < 6 ||
    (account.digits ?? 0) > 8 ||
    !Number.isInteger(account.period) ||
    (account.period ?? 0) < 1 ||
    (account.period ?? 0) > 120 ||
    (account.group !== undefined && typeof account.group !== "string")
  ) {
    return false;
  }

  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.name,
      algorithm: account.algorithm as Account["algorithm"],
      digits: account.digits as number,
      period: account.period as number,
      secret: normalizeBase32Secret(account.secret),
    });
    return /^\d+$/.test(totp.generate());
  } catch {
    return false;
  }
}

export function validateAccounts(value: unknown): value is Account[] {
  return Array.isArray(value) && value.every(validateAccount);
}
