import { memo, useCallback, useMemo } from "react";
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

type AccountCodeButtonProps = {
  code: string;
  accessibilityLabel: string;
  copyHint: string;
  onCopy: () => void;
};

/** The code-copy control only changes when the OTP or its labels change. */
const AccountCodeButton = memo(function AccountCodeButton({
  code,
  accessibilityLabel,
  copyHint,
  onCopy,
}: AccountCodeButtonProps) {
  return (
    <TouchableOpacity
      style={styles.codeArea}
      activeOpacity={BUTTON_ACTIVE_OPACITY_CODE}
      onPress={onCopy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.code}>
        {code.slice(0, 3)} {code.slice(3)}
      </Text>
      <Text style={styles.copyHint}>{copyHint}</Text>
    </TouchableOpacity>
  );
});

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
  const handleCopy = useCallback(() => void onCopyCode(code), [onCopyCode, code]);

  return (
    <View style={styles.codeRow}>
      <AccountCodeButton
        code={code}
        accessibilityLabel={`${t("accounts.copyVerificationCode")} ${account.issuer}`}
        copyHint={t("accounts.tapCopy")}
        onCopy={handleCopy}
      />
      <CountdownRing secondsRemaining={secondsRemaining} period={period} />
    </View>
  );
}

export default memo(AccountTotp);
