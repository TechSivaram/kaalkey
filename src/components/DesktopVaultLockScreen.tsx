import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppLanguage } from "../i18n";
import { vaultLockStyles as styles } from "../styles/vault-lock.styles";
import { BUTTON_ACTIVE_OPACITY_SOFT } from "../constants/ui";

type Props = {
  setup: boolean;
  authenticating: boolean;
  onSetPin: (pin: string) => Promise<boolean>;
  onUnlock: (pin: string) => Promise<boolean>;
};

export default function DesktopVaultLockScreen({
  setup,
  authenticating,
  onSetPin,
  onUnlock,
}: Props) {
  const { t } = useAppLanguage();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!/^\d{6,12}$/.test(pin)) {
      setError(t("messages.biometric.desktopPinInvalid"));
      return;
    }
    if (setup && pin !== confirmPin) {
      setError(t("messages.biometric.desktopPinMismatch"));
      return;
    }
    const ok = setup ? await onSetPin(pin) : await onUnlock(pin);
    if (!ok)
      setError(
        t(
          setup
            ? "messages.biometric.desktopPinSaveError"
            : "messages.biometric.desktopPinIncorrect",
        ),
      );
    else {
      setPin("");
      setConfirmPin("");
    }
  };

  return (
    <SafeAreaView style={styles.lockScreen} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.lockCard}>
        <View style={styles.lockIconCircle}>
          <Text style={styles.lockIcon}>🔐</Text>
        </View>
        <Text style={styles.lockBrand}>KaalKey</Text>
        <Text style={styles.lockTitle}>
          {setup
            ? t("messages.biometric.desktopPinSetupTitle")
            : t("messages.biometric.desktopPinTitle")}
        </Text>
        <Text style={styles.lockDescription}>
          {setup
            ? t("messages.biometric.desktopPinSetupBody")
            : t("messages.biometric.desktopPinBody")}
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder={t("messages.biometric.desktopPinTitle")}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={12}
          editable={!authenticating}
          autoFocus
          style={[styles.pinInput, styles.pinInputFirst]}
          onSubmitEditing={submit}
        />
        {setup && (
          <TextInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder={t("messages.biometric.desktopPinConfirm")}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={12}
            editable={!authenticating}
            style={[styles.pinInput, styles.pinInputConfirm]}
            onSubmitEditing={submit}
          />
        )}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={() => void submit()}
          disabled={authenticating}
          activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
        >
          <Text style={styles.unlockButtonText}>
            {authenticating
              ? t("home.waitingVerification")
              : t(
                  setup
                    ? "messages.biometric.desktopPinSetButton"
                    : "messages.biometric.desktopPinUnlockButton",
                )}
          </Text>
        </TouchableOpacity>
        <Text style={styles.lockFootnote}>{t("home.secretsStayStored")}</Text>
      </View>
    </SafeAreaView>
  );
}
