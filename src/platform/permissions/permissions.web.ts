import type { BiometricCapabilities, CameraPermissionController } from "./types";

/**
 * Browser camera permission is requested by getUserMedia inside the web
 * scanner. This hook therefore exposes no Expo Camera permission state.
 */
export function useCameraPermission(): CameraPermissionController {
  return {
    permission: null,
    requestPermission: async () => ({ granted: false }),
  };
}

/** Native biometric hardware/enrollment checks are unavailable in browser builds. */
export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  return {
    hardwareAvailable: false,
    biometricsEnrolled: false,
    supportedAuthenticationTypes: [],
  };
}

export type {
  BiometricCapabilities,
  CameraPermissionController,
  CameraPermissionRequestResult,
  CameraPermissionState,
} from "./types";
