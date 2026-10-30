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
  return (
    <View style={inlineStyles.fieldGroup}>
      <Text style={styles.inputLabel}>TOTP SETUP URL</Text>
      <View style={inlineStyles.urlInputRow}>
        <TextInput
          style={[styles.input, inlineStyles.urlInput]}
          placeholder={`${TOTP_URI_PREFIX}...`}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="TOTP setup URL"
        />
        <TouchableOpacity
          style={inlineStyles.inlineImportButton}
          onPress={() => void onImport(value)}
          accessibilityRole="button"
          accessibilityLabel="Import setup URL"
          disabled={!value.trim()}
        >
          <Text style={inlineStyles.inlineImportIcon}>↧</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
