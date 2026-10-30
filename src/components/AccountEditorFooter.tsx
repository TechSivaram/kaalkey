import { useAppLanguage } from "../i18n";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  editingId: string | null;
  onSave: () => Promise<void>;
  onCancel: () => void;
};

/** Save and cancel actions for the account editor. */
export default function AccountEditorFooter({ editingId, onSave, onCancel }: Props) {
  const { t } = useAppLanguage();
  return (
    <View>
      <TouchableOpacity style={styles.primaryButton} onPress={() => void onSave()}>
        <Text style={styles.primaryButtonText}>
          {editingId ? t("Save changes securely") : t("Save account securely")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>{t("Cancel")}</Text>
      </TouchableOpacity>
    </View>
  );
}
