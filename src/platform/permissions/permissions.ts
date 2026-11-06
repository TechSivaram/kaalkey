/**
 * Generic fallback for tooling or runtimes without platform-specific
 * module resolution. Native application builds resolve the Android/iOS
 * modules; web builds resolve permissions.web.ts.
 */
export { getBiometricCapabilities, useCameraPermission } from "./native";
export type {
  BiometricCapabilities,
  CameraPermissionController,
  CameraPermissionRequestResult,
  CameraPermissionState,
} from "./types";
