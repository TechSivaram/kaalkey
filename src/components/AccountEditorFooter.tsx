import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  editingId: string | null;
  onSave: () => Promise<void>;
  onCancel: () => void;
};

/** Save and cancel actions for the account editor. */
export default function AccountEditorFooter({ editingId, onSave, onCancel }: Props) {
  return (
    <View>
      <TouchableOpacity style={styles.primaryButton} onPress={() => void onSave()}>
        <Text style={styles.primaryButtonText}>
          {editingId ? "Save changes securely" : "Save account securely"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
