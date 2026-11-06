/**
 * Platform-neutral biometric authentication contract.
 * Platform implementations expose the same function signature.
 */
export interface BiometricPromptOptions {
  promptMessage: string;
  promptSubtitle?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  biometricsSecurityLevel?: "weak" | "strong";
}

export interface BiometricAuthenticationResult {
  success: boolean;
  error?: string;
}

export type BiometricAuthenticator = (
  options: BiometricPromptOptions,
) => Promise<BiometricAuthenticationResult>;
