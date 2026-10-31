import { useAppLanguage } from "../i18n";
import type { Dispatch, SetStateAction } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { TOTP_URI_PREFIX } from "../constants/totp";
import { COLORS } from "../constants/colors";
import { styles } from "../styles/home.styles";
import { accountTotpUrlImportStyles as inlineStyles } from "../styles/component.styles";

type Props = {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  onImport: (value: string) => Promise<void>;
  onPaste: () => Promise<void>;
};

/** Setup URL input with an inline import action and clipboard paste support. */
export default function AccountTotpUrlImport({ value, setValue, onImport, onPaste }: Props) {
  const { t } = useAppLanguage();
  return (
    <View style={inlineStyles.fieldGroup}>
      <Text style={styles.inputLabel}>{t("accountForm.totpSetupUrl2")}</Text>
      <View style={inlineStyles.urlInputRow}>
        <TextInput
          style={[styles.input, inlineStyles.urlInput]}
          placeholder={`${TOTP_URI_PREFIX}...`}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("accountForm.totpSetupUrl")}
        />
        <TouchableOpacity
          style={inlineStyles.inlineImportButton}
          onPress={() => void onImport(value)}
          accessibilityRole="button"
          accessibilityLabel={t("accountForm.importSetupUrl")}
          disabled={!value.trim()}
        >
          <Text style={inlineStyles.inlineImportIcon}>↧</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
