import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar
        hidden={false}
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
