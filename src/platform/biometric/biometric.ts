/**
 * Generic fallback for tooling or runtimes without platform-specific
 * resolution. Native app builds resolve biometric.android.ts or biometric.ios.ts;
 * web builds resolve biometric.web.ts.
 */
export { authenticateWithDevice } from "./native";
export type {
  BiometricAuthenticationResult,
  BiometricAuthenticator,
  BiometricPromptOptions,
} from "./types";
