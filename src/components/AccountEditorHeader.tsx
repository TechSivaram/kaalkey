import { useAppLanguage } from "../i18n";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  editingId: string | null;
  onClose: () => void;
};

/** Account editor title, description, and close action. */
export default function AccountEditorHeader({ editingId, onClose }: Props) {
  const { t } = useAppLanguage();
  return (
    <View style={styles.modalHeader}>
      <View style={styles.modalHeaderCopy}>
        <Text style={styles.modalTitle}>{editingId ? t("Edit") : t("Add account")}</Text>
        <Text style={styles.modalSubtitle}>
          {editingId
            ? t("Update the service, account name, or secret key.")
            : t("Scan a QR code for the easiest setup, or enter details manually.")}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onClose}
        style={styles.modalCloseButton}
        accessibilityRole="button"
        accessibilityLabel={t("Close account form")}
        hitSlop={8}
      >
        <Text style={styles.closeButton}>×</Text>
      </TouchableOpacity>
    </View>
  );
}
