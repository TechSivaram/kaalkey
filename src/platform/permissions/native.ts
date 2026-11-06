import { useCameraPermissions } from "expo-camera";
import * as LocalAuthentication from "expo-local-authentication";
import type { BiometricCapabilities, CameraPermissionController } from "./types";

/**
 * Native camera permission hook shared by Android and iOS.
 * Expo Camera handles the OS-specific permission prompt and status.
 */
export function useCameraPermission(): CameraPermissionController {
  const [permission, requestPermission] = useCameraPermissions();

  return {
    permission,
    requestPermission,
  };
}

/**
 * Reports biometric hardware and enrollment capabilities.
 *
 * This is informational only: callers must not use a missing biometric
 * enrollment to bypass or disable the device-credential authentication path.
 */
export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  const [hardwareAvailable, biometricsEnrolled, supportedAuthenticationTypes] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  return {
    hardwareAvailable,
    biometricsEnrolled,
    supportedAuthenticationTypes,
  };
}
