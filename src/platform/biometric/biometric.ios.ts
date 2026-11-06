/**
 * Platform entry point. Android and iOS share the native Expo implementation,
 * while keeping separate files for automatic platform resolution and future
 * platform-specific behavior.
 */
export { authenticateWithDevice } from "./native";
export type {
  BiometricAuthenticationResult,
  BiometricAuthenticator,
  BiometricPromptOptions,
} from "./types";
