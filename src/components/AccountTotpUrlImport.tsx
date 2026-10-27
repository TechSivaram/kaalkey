import type { Dispatch, SetStateAction } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { TOTP_URI_PREFIX } from "../constants/totp";
import { COLORS } from "../constants/colors";
import { styles } from "../styles/home.styles";

type Props = {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  onImport: (value: string) => Promise<void>;
  onPaste: () => Promise<void>;
};

/** Controlled TOTP setup URL input and import/paste actions. */
export default function AccountTotpUrlImport({ value, setValue, onImport, onPaste }: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
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
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <TouchableOpacity
          style={[styles.scanButton, { flex: 1 }]}
          onPress={() => void onImport(value)}
        >
          <Text style={styles.scanButtonTitle}>Import URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanButton, { flex: 1 }]}
          onPress={() => void onPaste()}
        >
          <Text style={styles.scanButtonTitle}>Paste URL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
