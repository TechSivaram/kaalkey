/** Shared TOTP URI protocol prefix and policy values used by the editor, importer, and account validator. */
export const TOTP_URI_PREFIX = "otpauth://totp/";
export const SUPPORTED_TOTP_ALGORITHMS = ["SHA1", "SHA256", "SHA512"] as const;
export const SUPPORTED_TOTP_DIGITS = [6, 7, 8] as const;
export const DEFAULT_TOTP_ALGORITHM = "SHA1" as const;
export const DEFAULT_TOTP_DIGITS = 6;
export const DEFAULT_TOTP_PERIOD_SECONDS = 30;
export const MIN_TOTP_PERIOD_SECONDS = 1;
export const MAX_TOTP_PERIOD_SECONDS = 120;
/** Maximum number of digits needed to enter a supported TOTP period. */
export const TOTP_PERIOD_INPUT_MAX_LENGTH = String(MAX_TOTP_PERIOD_SECONDS).length;
export const TOTP_PERIOD_PRESETS = [15, 30, 60, 90, 120] as const;
