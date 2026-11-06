import { isWeb } from "../platform/runtime";
import { Alert } from "react-native";

/** Displays a message consistently on Web and native platforms. */
export function showUserMessage(title: string, message: string): void {
  if (isWeb && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
