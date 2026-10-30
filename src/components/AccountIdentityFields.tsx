import { useAppLanguage } from "../i18n";
import type { Dispatch, SetStateAction } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";
import { COLORS } from "../constants/colors";
import { BUTTON_ACTIVE_OPACITY } from "../constants/ui";

type Props = {
  issuer: string;
  setIssuer: Dispatch<SetStateAction<string>>;
  accountName: string;
  setAccountName: Dispatch<SetStateAction<string>>;
};

/** Service and account identity inputs with their clear actions. */
export default function AccountIdentityFields({
  issuer,
  setIssuer,
  accountName,
  setAccountName,
}: Props) {
  const { t } = useAppLanguage();
  return (
    <>
      <Text style={styles.inputLabel}>{t("SERVICE / ISSUER")}</Text>
      <View style={styles.inputClearWrapper}>
        <TextInput
          style={[styles.input, styles.inputWithClearSpace]}
          placeholder={t("e.g. Google")}
          placeholderTextColor={COLORS.textMuted}
          value={issuer}
          onChangeText={setIssuer}
          autoCapitalize="words"
          accessibilityLabel={t("Service or issuer")}
        />
        {issuer.length > 0 && (
          <TouchableOpacity
            style={styles.clearInputButton}
            onPress={() => setIssuer("")}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={t("Clear service or issuer")}
            hitSlop={6}
          >
            <Text style={styles.clearInputButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.inputLabel}>{t("ACCOUNT NAME")}</Text>
      <View style={styles.inputClearWrapper}>
        <TextInput
          style={[styles.input, styles.inputWithClearSpace]}
          placeholder={t("e.g. you@example.com")}
          placeholderTextColor={COLORS.textMuted}
          value={accountName}
          onChangeText={setAccountName}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel={t("Account name")}
        />
        {accountName.length > 0 && (
          <TouchableOpacity
            style={styles.clearInputButton}
            onPress={() => setAccountName("")}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={t("Clear account name")}
            hitSlop={6}
          >
            <Text style={styles.clearInputButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}
