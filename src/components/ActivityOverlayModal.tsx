import { ActivityIndicator, Modal, Platform, Text, View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

type Props = {
  insets: { top: number; bottom: number };
  activityMessage: string | null;
};

/** Displays the blocking activity layer above the app's other dialogs. */
export default function ActivityOverlayModal({ insets, activityMessage }: Props) {
  const inlineStyles = StyleSheet.create({
    inline1: {
      flex: 1,
      zIndex: 2147483647,
      elevation: 2147483647,
      backgroundColor: "rgba(8, 18, 32, 0.42)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      ...(Platform.OS === "android"
        ? {
            paddingTop: Math.max(insets.top + 24, 36),
            paddingBottom: Math.max(insets.bottom + 24, 36),
          }
        : {}),
    },
    inline2: {
      minWidth: 190,
      maxWidth: 300,
      paddingVertical: 24,
      paddingHorizontal: 28,
      borderRadius: 18,
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.7)",
    },
    inline3: {
      color: COLORS.navy,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 14,
      textAlign: "center",
    },
    inline4: { color: "#64748B", fontSize: 12, marginTop: 6, textAlign: "center" },
  });
  return (
    <Modal
      visible={activityMessage !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={() => {}}
    >
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={activityMessage ?? "Working"}
        // Keep the activity layer above every app dialog on web and native.
        // The Modal is rendered last in this screen so it also wins portal order.
        pointerEvents="auto"
        style={inlineStyles.inline1}
      >
        <View style={inlineStyles.inline2}>
          <ActivityIndicator size="large" color={COLORS.saffronDark} />
          <Text style={inlineStyles.inline3}>{activityMessage ?? "Please wait…"}</Text>
          <Text style={inlineStyles.inline4}>Please don’t close or interact with KaalKey.</Text>
        </View>
      </View>
    </Modal>
  );
}
