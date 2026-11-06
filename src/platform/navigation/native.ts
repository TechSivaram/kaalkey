import { BackHandler } from "react-native";
import type { HardwareBackPressHandler, Unsubscribe } from "./types";

/** Native hardware Back subscription used by Android. */
export function subscribeToHardwareBackPress(handler: HardwareBackPressHandler): Unsubscribe {
  const subscription = BackHandler.addEventListener("hardwareBackPress", handler);
  return () => subscription.remove();
}
