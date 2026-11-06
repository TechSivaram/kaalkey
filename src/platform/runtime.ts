import { Platform } from "react-native";

/**
 * Centralized runtime information for the supported Expo targets.
 * Keep direct React Native platform checks inside this module so application
 * code can depend on capabilities instead of inspecting Platform.OS itself.
 */
export type RuntimePlatform = "android" | "ios" | "web" | "unknown";

export const runtimePlatform: RuntimePlatform =
  Platform.OS === "android" || Platform.OS === "ios" || Platform.OS === "web"
    ? Platform.OS
    : "unknown";

export const isAndroid = runtimePlatform === "android";
export const isIOS = runtimePlatform === "ios";
export const isWeb = runtimePlatform === "web";
/** Electron renders through React Native Web, so keep it distinct from a normal browser. */
export const isDesktop =
  isWeb && typeof navigator !== "undefined" && /Electron\//i.test(navigator.userAgent);
export const isNative = isAndroid || isIOS;
