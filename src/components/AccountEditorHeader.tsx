import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  editingId: string | null;
  onClose: () => void;
};

/** Account editor title, description, and close action. */
export default function AccountEditorHeader({ editingId, onClose }: Props) {
  return (
    <View style={styles.modalHeader}>
      <View style={styles.modalHeaderCopy}>
        <Text style={styles.modalTitle}>
          {editingId ? "Edit account" : "Add account"}
        </Text>
        <Text style={styles.modalSubtitle}>
          {editingId
            ? "Update the service, account name, or secret key."
            : "Scan a QR code for the easiest setup, or enter details manually."}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onClose}
        style={styles.modalCloseButton}
        accessibilityRole="button"
        accessibilityLabel="Close account form"
        hitSlop={8}
      >
        <Text style={styles.closeButton}>×</Text>
      </TouchableOpacity>
    </View>
  );
}
