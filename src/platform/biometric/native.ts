import * as LocalAuthentication from "expo-local-authentication";
import type { BiometricAuthenticator, BiometricPromptOptions } from "./types";

/**
 * Shared native implementation for Android and iOS.
 * Expo Local Authentication invokes the appropriate operating-system prompt.
 */
export const authenticateWithDevice: BiometricAuthenticator = async (
  options: BiometricPromptOptions,
) => {
  const result = await LocalAuthentication.authenticateAsync(options);

  return result.success ? { success: true } : { success: false, error: result.error };
};
