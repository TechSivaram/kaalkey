import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/home.styles";
import { BUTTON_ACTIVE_OPACITY_SOFT } from "../constants/ui";

type Props = {
  biometricReady: boolean;
  authenticating: boolean;
  onUnlock: () => void;
};

/** Blocks access to the vault until the app's lock checks are complete. */
export default function VaultLockScreen({
  biometricReady,
  authenticating,
  onUnlock,
}: Props) {
  return (
        <SafeAreaView style={styles.lockScreen} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.lockCard}>
            <View style={styles.lockIconCircle}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>
            <Text style={styles.lockBrand}>KaalKey</Text>
            <Text style={styles.lockTitle}>
              {!biometricReady ? "Securing your vault…" : "Your vault is protected"}
            </Text>
            <Text style={styles.lockDescription}>
              {!biometricReady
                ? "Checking your secure lock settings. Your codes remain hidden."
                : "Use your phone’s biometrics or screen-lock PIN, pattern, or password to access your one-time verification codes."}
            </Text>
            {biometricReady && (
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={onUnlock}
                disabled={authenticating}
                activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
              >
                <Text style={styles.unlockButtonText}>
                  {authenticating ? "Waiting for verification…" : "Unlock securely"}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.lockFootnote}>Your secrets stay stored on this device.</Text>
          </View>
        </SafeAreaView>
  );
}
