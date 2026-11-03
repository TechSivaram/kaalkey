import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { Account } from "../types/account";
import { styles } from "../styles/home.styles";
import { useAppLanguage } from "../i18n";
import AccountTotp from "./AccountTotp";

type Props = {
  account: Account;
  onCopyCode: (code: string) => void | Promise<void>;
  onViewQr: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
};

/** Renders one authenticator account and its current one-time code. */
function AccountCard({ account, onCopyCode, onViewQr, onEdit, onDelete }: Props) {
  const { t } = useAppLanguage();

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountIcon}>
          <Text style={styles.accountIconText}>{account.issuer.slice(0, 1).toUpperCase()}</Text>
        </View>

        <View style={styles.accountInfo}>
          <Text style={styles.accountIssuer}>{account.issuer}</Text>
          <Text style={styles.accountName}>{account.name}</Text>
        </View>

        <View style={styles.accountActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onViewQr(account)}
            accessibilityRole="button"
            accessibilityLabel={`${t("accounts.viewQrCode")} ${account.issuer}`}
          >
            <Text style={styles.editButtonText}>▦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(account)}
            accessibilityRole="button"
            accessibilityLabel={`${t("accounts.edit")} ${account.issuer}`}
          >
            <Text style={styles.editButtonText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onDelete(account.id)}
            accessibilityRole="button"
            accessibilityLabel={`${t("accounts.removeAccount")} ${account.issuer}`}
          >
            <View style={styles.deleteCan}>
              <View style={styles.deleteCanHandle} />
              <View style={styles.deleteCanLid} />
              <View style={styles.deleteCanBody}>
                <View style={styles.deleteCanLine} />
                <View style={styles.deleteCanLine} />
                <View style={styles.deleteCanLine} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <AccountTotp account={account} onCopyCode={onCopyCode} />
    </View>
  );
}

export default memo(AccountCard);
