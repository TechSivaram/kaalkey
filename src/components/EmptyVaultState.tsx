import { useAppLanguage } from "../i18n";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type EmptyVaultStateProps = {
  onAddAccount: () => void;
};

/** Empty-state prompt shown before the first authenticator account is added. */
export default function EmptyVaultState({ onAddAccount }: EmptyVaultStateProps) {
  const { t } = useAppLanguage();
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>

      <Text style={styles.emptyTitle}>{t("Your vault starts here")}</Text>

      <Text style={styles.emptyText}>
        {t("Add an account using its secret key to generate your first verification code.")}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onAddAccount}>
        <Text style={styles.primaryButtonText}>{t("Add your first account")}</Text>
      </TouchableOpacity>
    </View>
  );
}
