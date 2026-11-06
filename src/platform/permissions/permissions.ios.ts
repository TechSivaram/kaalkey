/**
 * Native permission and capability entry point.
 * Android and iOS share Expo's native permission implementations.
 */
export { getBiometricCapabilities, useCameraPermission } from "./native";
export type {
  BiometricCapabilities,
  CameraPermissionController,
  CameraPermissionRequestResult,
  CameraPermissionState,
} from "./types";
