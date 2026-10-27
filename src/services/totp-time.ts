import { DEFAULT_TOTP_PERIOD_SECONDS } from "../constants/totp";

export type TotpCountdown = {
  period: number;
  secondsRemaining: number;
};

/** Calculate the displayed TOTP countdown using the account's configured period. */
export function getTotpCountdown(
  now: number,
  configuredPeriod?: number,
): TotpCountdown {
  const period = Math.max(1, configuredPeriod || DEFAULT_TOTP_PERIOD_SECONDS);
  const elapsed = now > 0 ? (now / 1000) % period : 0;
  const secondsRemaining = Math.max(1, Math.ceil(period - elapsed));

  return { period, secondsRemaining };
}
