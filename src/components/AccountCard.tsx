import { Text, TouchableOpacity, View } from "react-native";
import type { Account } from "../types/account";
import { generateCode } from "../services/otp";
import CountdownRing from "./CountdownRing";
import { styles } from "../styles/home.styles";
import { BUTTON_ACTIVE_OPACITY_CODE } from "../constants/ui";
import { getTotpCountdown } from "../services/totp-time";

type Props = {
  account: Account;
  now: number;
  onCopyCode: (code: string) => void | Promise<void>;
  onViewQr: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
};

/** Renders one authenticator account and its current one-time code. */
export default function AccountCard({
  account,
  now,
  onCopyCode,
  onViewQr,
  onEdit,
  onDelete,
}: Props) {
  const code = generateCode(account);
  const { period, secondsRemaining } = getTotpCountdown(now, account.period);

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountIcon}>
          <Text style={styles.accountIconText}>
            {account.issuer.slice(0, 1).toUpperCase()}
          </Text>
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
            accessibilityLabel={`View QR code for ${account.issuer}`}
          >
            <Text style={styles.editButtonText}>QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(account)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${account.issuer} account`}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(account.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${account.issuer} account`}
          >
            <Text style={styles.deleteIcon}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.codeRow}>
        <TouchableOpacity
          style={styles.codeArea}
          activeOpacity={BUTTON_ACTIVE_OPACITY_CODE}
          onPress={() => void onCopyCode(code)}
          accessibilityRole="button"
          accessibilityLabel={`Copy verification code for ${account.issuer}`}
        >
          <Text style={styles.code}>
            {code.slice(0, 3)} {code.slice(3)}
          </Text>
          <Text style={styles.copyHint}>TAP TO COPY</Text>
        </TouchableOpacity>

        <CountdownRing secondsRemaining={secondsRemaining} period={period} />
      </View>
    </View>
  );
}
