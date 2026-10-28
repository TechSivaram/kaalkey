import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { BUTTON_ACTIVE_OPACITY_STANDARD } from "../constants/ui";
import { styles } from "../styles/home.styles";

type HomeHeaderProps = {
  biometricEnabled: boolean;
  onToggleBiometricLock: () => void;
  onOpenSettings: () => void;
};

/** Renders the brand header, security control, settings button, and tricolour stripe. */
export default function HomeHeader({
  biometricEnabled,
  onToggleBiometricLock,
  onOpenSettings,
}: HomeHeaderProps) {
  const inlineStyles = StyleSheet.create({
    inline1: { backgroundColor: COLORS.saffron },
    inline2: { backgroundColor: COLORS.white },
    inline3: { backgroundColor: COLORS.indiaGreen },
  });
  return (
    <>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandMarkFrame}>
            <Image
              source={require("../../assets/images/kaalkey-full-logo-white.png")}
              style={styles.brandMark}
              resizeMode="contain"
              accessibilityLabel="KaalKey tricolour lock emblem"
            />
          </View>
          <View style={styles.brandTextBlock}>
            <Text style={styles.brandName}>
              <Text style={styles.brandKaal}>Kaal</Text>
              <Text style={styles.brandK}>K</Text>
              <Text style={styles.brandEy}>ey</Text>
            </Text>
            <Text style={styles.brandSubtitle}>AUTHENTICATOR</Text>
            <View style={styles.secureBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.secureText}>LOCAL VAULT</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.securityButton, biometricEnabled && styles.securityButtonActive]}
            onPress={onToggleBiometricLock}
            activeOpacity={BUTTON_ACTIVE_OPACITY_STANDARD}
            accessibilityRole="button"
            accessibilityLabel={biometricEnabled ? "Disable app lock" : "Enable app lock"}
          >
            <Text style={styles.securityButtonIcon}>{biometricEnabled ? "🔒" : "🔐"}</Text>
            <Text
              style={[
                styles.securityButtonText,
                biometricEnabled && styles.securityButtonTextActive,
              ]}
            >
              {biometricEnabled ? "LOCK ON" : "SECURITY"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconButton}
            onPress={onOpenSettings}
            activeOpacity={BUTTON_ACTIVE_OPACITY_STANDARD}
            accessibilityRole="button"
            accessibilityLabel="Open app settings"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tricolorStripe}>
        <View style={[styles.tricolorSegment, inlineStyles.inline1]} />
        <View style={[styles.tricolorSegment, inlineStyles.inline2]} />
        <View style={[styles.tricolorSegment, inlineStyles.inline3]} />
      </View>
    </>
  );
}
