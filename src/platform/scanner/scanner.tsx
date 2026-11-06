/**
 * Generic fallback for tooling or runtimes without platform-specific resolution.
 * Native CameraView is the safest fallback for Expo native targets.
 */
export { default } from "./native";
export type { ScannerCameraProps } from "./types";
