import type { BiometricAuthenticator } from "./types";

/**
 * Browser builds do not currently provide KaalKey's native authentication flow.
 * The app-lock hook keeps locking disabled on web; this implementation also
 * fails safely if invoked directly.
 */
export const authenticateWithDevice: BiometricAuthenticator = async () => ({
  success: false,
  error: "not_available",
});

export type {
  BiometricAuthenticationResult,
  BiometricAuthenticator,
  BiometricPromptOptions,
} from "./types";
