import { memo, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { Account } from "../types/account";
import { generateCode } from "../services/otp";
import { getTotpCountdown } from "../services/totp-time";
import { useTotpClock } from "../services/totp-clock";
import { styles } from "../styles/home.styles";
import { BUTTON_ACTIVE_OPACITY_CODE } from "../constants/ui";
import CountdownRing from "./CountdownRing";
import { useAppLanguage } from "../i18n";

type Props = {
  account: Account;
  onCopyCode: (code: string) => void | Promise<void>;
};

/** Clock-driven TOTP display isolated from static account-card UI. */
function AccountTotp({ account, onCopyCode }: Props) {
  const { t } = useAppLanguage();
  const now = useTotpClock();
  const periodSeconds = Math.max(1, account.period);
  const timeStep = Math.floor(now / (periodSeconds * 1000));
  const code = useMemo(
    () => generateCode(account, timeStep * periodSeconds * 1000),
    [account, timeStep, periodSeconds],
  );
  const { period, secondsRemaining } = getTotpCountdown(now, account.period);

  return (
    <View style={styles.codeRow}>
      <TouchableOpacity
        style={styles.codeArea}
        activeOpacity={BUTTON_ACTIVE_OPACITY_CODE}
        onPress={() => void onCopyCode(code)}
        accessibilityRole="button"
        accessibilityLabel={`${t("accounts.copyVerificationCode")} ${account.issuer}`}
      >
        <Text style={styles.code}>
          {code.slice(0, 3)} {code.slice(3)}
        </Text>
        <Text style={styles.copyHint}>{t("accounts.tapCopy")}</Text>
      </TouchableOpacity>
      <CountdownRing secondsRemaining={secondsRemaining} period={period} />
    </View>
  );
}

export default memo(AccountTotp);
