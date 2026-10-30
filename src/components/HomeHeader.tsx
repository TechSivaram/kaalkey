import { Image, Text, TouchableOpacity, View } from "react-native";
import { BUTTON_ACTIVE_OPACITY_STANDARD } from "../constants/ui";
import { styles } from "../styles/home.styles";
import { homeHeaderAccentStyles } from "../styles/component.styles";
import { useAppLanguage } from "../i18n";

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
  const { t } = useAppLanguage();
  return (
    <>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandMarkFrame}>
            <Image
              source={require("../../assets/images/kaalkey-full-logo-white.png")}
              style={styles.brandMark}
              resizeMode="contain"
              accessibilityLabel={t("KaalKey tricolour lock emblem")}
            />
          </View>
          <View style={styles.brandTextBlock}>
            <Text style={styles.brandName}>
              <Text style={styles.brandKaal}>Kaal</Text>
              <Text style={styles.brandK}>K</Text>
              <Text style={styles.brandEy}>ey</Text>
            </Text>
            <Text style={styles.brandSubtitle}>{t("AUTHENTICATOR")}</Text>
            <View style={styles.secureBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.secureText}>{t("LOCAL VAULT")}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.securityButton, biometricEnabled && styles.securityButtonActive]}
            onPress={onToggleBiometricLock}
            activeOpacity={BUTTON_ACTIVE_OPACITY_STANDARD}
            accessibilityRole="button"
            accessibilityLabel={biometricEnabled ? t("Disable app lock") : t("Enable app lock")}
          >
            <Text style={styles.securityButtonIcon}>{biometricEnabled ? "🔒" : "🔐"}</Text>
            <Text
              style={[
                styles.securityButtonText,
                biometricEnabled && styles.securityButtonTextActive,
              ]}
            >
              {biometricEnabled ? t("LOCK ON") : t("SECURITY")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconButton}
            onPress={onOpenSettings}
            activeOpacity={BUTTON_ACTIVE_OPACITY_STANDARD}
            accessibilityRole="button"
            accessibilityLabel={t("Open app settings")}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tricolorStripe}>
        <View style={[styles.tricolorSegment, homeHeaderAccentStyles.saffron]} />
        <View style={[styles.tricolorSegment, homeHeaderAccentStyles.white]} />
        <View style={[styles.tricolorSegment, homeHeaderAccentStyles.green]} />
      </View>
    </>
  );
}
