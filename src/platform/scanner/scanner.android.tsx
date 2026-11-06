/**
 * Platform-specific entry point. Android and iOS currently share Expo CameraView;
 * keep these entry points separate for future OS-specific scanner behavior.
 */
export { default } from "./native";
export type { ScannerCameraProps } from "./types";
