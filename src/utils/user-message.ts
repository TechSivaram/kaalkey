import { Alert, Platform } from "react-native";

/** Displays a message consistently on Web and native platforms. */
export function showUserMessage(title: string, message: string): void {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
