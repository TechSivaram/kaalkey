import { ActivityIndicator, Modal, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { getActivityOverlayStyles } from "../styles/component.styles";

type Props = {
  insets: { top: number; bottom: number };
  activityMessage: string | null;
};

/** Displays the blocking activity layer above the app's other dialogs. */
export default function ActivityOverlayModal({ insets, activityMessage }: Props) {
  const inlineStyles = getActivityOverlayStyles(insets);

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
        style={inlineStyles.overlay}
      >
        <View style={inlineStyles.card}>
          <ActivityIndicator size="large" color={COLORS.saffronDark} />
          <Text style={inlineStyles.message}>{activityMessage ?? "Please wait…"}</Text>
          <Text style={inlineStyles.hint}>Please don’t close or interact with KaalKey.</Text>
        </View>
      </View>
    </Modal>
  );
}
