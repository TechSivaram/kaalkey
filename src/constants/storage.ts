/**
 * Centralized persistent-storage keys.
 *
 * Keep these values stable: changing an existing key can make saved preferences
 * or account data appear to be missing after an app update.
 */
export const ACCOUNTS_STORAGE_KEY = "kaalkey_accounts_v1";
export const BIOMETRIC_ENABLED_STORAGE_KEY = "kaalkey_biometric_lock_enabled_v1";
export const HAPTICS_ENABLED_STORAGE_KEY = "kaalkey_haptics_enabled_v1";
export const LEGAL_ACCEPTANCE_STORAGE_KEY = "kaalkey_legal_acceptance_v1";
