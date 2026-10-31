import { useAppLanguage } from "../i18n";
import type { Dispatch, SetStateAction } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Account } from "../types/account";
import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_ALGORITHMS,
  SUPPORTED_TOTP_DIGITS,
  TOTP_PERIOD_INPUT_MAX_LENGTH,
  TOTP_PERIOD_PRESETS,
} from "../constants/totp";
import { styles } from "../styles/home.styles";
import { BUTTON_ACTIVE_OPACITY } from "../constants/ui";
import { COLORS } from "../constants/colors";

type Props = {
  editingId: string | null;
  secret: string;
  setSecret: Dispatch<SetStateAction<string>>;
  otpAlgorithm: Account["algorithm"];
  setOtpAlgorithm: Dispatch<SetStateAction<Account["algorithm"]>>;
  otpDigits: number;
  setOtpDigits: Dispatch<SetStateAction<number>>;
  otpPeriod: string;
  setOtpPeriod: Dispatch<SetStateAction<string>>;
};

export default function AccountTotpFields({
  editingId,
  secret,
  setSecret,
  otpAlgorithm,
  setOtpAlgorithm,
  otpDigits,
  setOtpDigits,
  otpPeriod,
  setOtpPeriod,
}: Props) {
  const { t } = useAppLanguage();
  return (
    <>
      <Text style={styles.inputLabel}>
        {editingId ? t("accountForm.secretKeyLocked") : t("accountForm.secretKeyBase322")}
      </Text>

      <View style={styles.inputClearWrapper}>
        <TextInput
          style={[styles.input, styles.inputWithClearSpace]}
          placeholder={t("accountForm.enterSetupKey")}
          placeholderTextColor={COLORS.textMuted}
          value={secret}
          onChangeText={setSecret}
          autoCapitalize="characters"
          autoCorrect={false}
          secureTextEntry
          editable={!editingId}
          selectTextOnFocus={!editingId}
          accessibilityLabel={
            editingId ? t("accountForm.secretKeyRead") : t("accountForm.secretKeyBase32")
          }
        />
        {!editingId && secret.length > 0 && (
          <TouchableOpacity
            style={styles.clearInputButton}
            onPress={() => setSecret("")}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={t("accountForm.clearSecretKey")}
            hitSlop={6}
          >
            <Text style={styles.clearInputButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.inputLabel}>{t("accountForm.otpAlgorithm")}</Text>
      <View style={styles.optionRow}>
        {SUPPORTED_TOTP_ALGORITHMS.map((algorithm) => (
          <TouchableOpacity
            key={algorithm}
            style={[styles.optionChip, otpAlgorithm === algorithm && styles.optionChipSelected]}
            onPress={() => setOtpAlgorithm(algorithm)}
            accessibilityRole="button"
            accessibilityState={{ selected: otpAlgorithm === algorithm }}
          >
            <Text
              style={[
                styles.optionChipText,
                otpAlgorithm === algorithm && styles.optionChipTextSelected,
              ]}
            >
              {algorithm.replace("SHA", "SHA-")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>{t("accountForm.otpDigits")}</Text>
      <View style={styles.optionRow}>
        {SUPPORTED_TOTP_DIGITS.map((digits) => (
          <TouchableOpacity
            key={digits}
            style={[styles.optionChip, otpDigits === digits && styles.optionChipSelected]}
            onPress={() => setOtpDigits(digits)}
            accessibilityRole="button"
            accessibilityState={{ selected: otpDigits === digits }}
          >
            <Text
              style={[styles.optionChipText, otpDigits === digits && styles.optionChipTextSelected]}
            >
              {digits} {t("accountForm.digits")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>{t("accountForm.refreshIntervalSeconds")}</Text>
      <TextInput
        style={styles.input}
        value={otpPeriod}
        onChangeText={(value) =>
          setOtpPeriod(value.replace(/[^0-9]/g, "").slice(0, TOTP_PERIOD_INPUT_MAX_LENGTH))
        }
        keyboardType="number-pad"
        placeholder={`${MIN_TOTP_PERIOD_SECONDS}–${MAX_TOTP_PERIOD_SECONDS} ${t("accountForm.seconds")}`}
        placeholderTextColor={COLORS.textMuted}
        accessibilityLabel={t("accountForm.otpRefreshInterval")}
      />
      <View style={styles.optionRow}>
        {TOTP_PERIOD_PRESETS.map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.optionChip, Number(otpPeriod) === period && styles.optionChipSelected]}
            onPress={() => setOtpPeriod(String(period))}
            accessibilityRole="button"
            accessibilityState={{ selected: Number(otpPeriod) === period }}
          >
            <Text
              style={[
                styles.optionChipText,
                Number(otpPeriod) === period && styles.optionChipTextSelected,
              ]}
            >
              {period}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.securityNote}>{t("accountForm.secretKeySupplied")}</Text>
    </>
  );
}
