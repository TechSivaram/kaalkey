import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/home.styles";
import { BUTTON_ACTIVE_OPACITY_SOFT } from "../constants/ui";
import { useAppLanguage } from "../i18n";

type Props = {
  biometricReady: boolean;
  authenticating: boolean;
  onUnlock: () => void;
};

/** Blocks access to the vault until the app's lock checks are complete. */
export default function VaultLockScreen({ biometricReady, authenticating, onUnlock }: Props) {
  const { t } = useAppLanguage();
  return (
    <SafeAreaView style={styles.lockScreen} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.lockCard}>
        <View style={styles.lockIconCircle}>
          <Text style={styles.lockIcon}>🔐</Text>
        </View>
        <Text style={styles.lockBrand}>KaalKey</Text>
        <Text style={styles.lockTitle}>
          {!biometricReady ? t("home.securingVault") : t("home.vaultProtected")}
        </Text>
        <Text style={styles.lockDescription}>
          {!biometricReady ? t("home.checkingSecureLock") : t("home.unlockRequirement")}
        </Text>
        {biometricReady && (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={onUnlock}
            disabled={authenticating}
            activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
          >
            <Text style={styles.unlockButtonText}>
              {authenticating ? t("home.waitingVerification") : t("home.unlockSecurely")}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.lockFootnote}>{t("home.secretsStayStored")}</Text>
      </View>
    </SafeAreaView>
  );
}
