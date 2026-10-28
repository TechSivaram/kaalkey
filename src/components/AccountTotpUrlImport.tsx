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

/** Controlled TOTP setup URL input and import/paste actions. */
export default function AccountTotpUrlImport({ value, setValue, onImport, onPaste }: Props) {
  return (
    <View style={inlineStyles.fieldGroup}>
      <Text style={styles.inputLabel}>TOTP SETUP URL</Text>
      <TextInput
        style={styles.input}
        placeholder={`${TOTP_URI_PREFIX}...`}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="TOTP setup URL"
      />
      <View style={inlineStyles.actionRow}>
        <TouchableOpacity
          style={[styles.scanButton, inlineStyles.importButton]}
          onPress={() => void onImport(value)}
        >
          <Text style={styles.scanButtonTitle}>Import URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanButton, inlineStyles.pasteButton]}
          onPress={() => void onPaste()}
        >
          <Text style={styles.scanButtonTitle}>Paste URL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
