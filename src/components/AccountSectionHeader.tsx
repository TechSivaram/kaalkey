import { useAppLanguage } from "../i18n";
import { Text, TouchableOpacity, View } from "react-native";
import { BUTTON_ACTIVE_OPACITY_STANDARD } from "../constants/ui";
import { styles } from "../styles/home.styles";
import { getAccountCountLabel } from "../utils/accountListMessages";

type AccountSectionHeaderProps = {
  accountCount: number;
  onAddAccount: () => void;
};

/** Header for the account list, including the count and add-account action. */
export default function AccountSectionHeader({
  accountCount,
  onAddAccount,
}: AccountSectionHeaderProps) {
  const { t } = useAppLanguage();
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{t("accounts.accounts")}</Text>
        <Text style={styles.accountCount}>
          {accountCount} {getAccountCountLabel(accountCount)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={BUTTON_ACTIVE_OPACITY_STANDARD}
        onPress={onAddAccount}
        accessibilityRole="button"
        accessibilityLabel={t("accountForm.addAccount")}
      >
        <Text style={styles.addButtonText}>{t("accounts.add")}</Text>
      </TouchableOpacity>
    </View>
  );
}
