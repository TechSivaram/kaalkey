import { ActivityIndicator, Modal, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { getActivityOverlayStyles } from "../styles/component.styles";
import { useAppLanguage } from "../i18n";

type Props = {
  insets: { top: number; bottom: number };
  activityMessage: string | null;
  visible?: boolean;
};

/** Displays the blocking activity layer above the app's other dialogs. */
export default function ActivityOverlayModal({ insets, activityMessage, visible }: Props) {
  const inlineStyles = getActivityOverlayStyles(insets);
  const { t } = useAppLanguage();

  return (
    <Modal
      visible={visible ?? activityMessage !== null}
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
        accessibilityLabel={activityMessage ?? t("activity.working")}
        // This single modal is mounted in the root layout, above the app navigator.
        pointerEvents="auto"
        style={inlineStyles.overlay}
      >
        <View style={inlineStyles.card}>
          <ActivityIndicator size="large" color={COLORS.saffronDark} />
          <Text style={inlineStyles.message}>{activityMessage ?? t("activity.wait")}</Text>
          <Text style={inlineStyles.hint}>{t("activity.donTClose")}</Text>
        </View>
      </View>
    </Modal>
  );
}
