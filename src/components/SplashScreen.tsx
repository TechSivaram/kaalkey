import { Image, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/home.styles";
import { useAppLanguage } from "../i18n";
import ActivityOverlayModal from "./ActivityOverlayModal";

/** Branded startup screen shown while initial app checks run. */
export default function SplashScreen() {
  const { t, languageLoading, translationLoading } = useAppLanguage();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.splashScreen} edges={["top", "right", "bottom", "left"]}>
      <View style={styles.splashBrandCard}>
        <Image
          source={require("../../assets/images/kaalkey-full-logo-white.png")}
          style={styles.splashLogo}
          resizeMode="contain"
          accessibilityLabel={t("home.tricolourLockEmblem")}
        />
        <Text style={styles.splashTitle}>
          <Text style={styles.splashKaal}>Kaal</Text>
          <Text style={styles.splashK}>K</Text>
          <Text style={styles.splashEy}>ey</Text>
        </Text>
        <Text style={styles.splashSubtitle}>{t("home.authenticator")}</Text>
        <View style={styles.splashBadge}>
          <View style={styles.splashDot} />
          <Text style={styles.splashBadgeText}>{t("home.localVault")}</Text>
        </View>
        <View style={styles.splashDivider} />
        <Text style={styles.splashTagline}>{t("home.codesDeviceControl")}</Text>
      </View>
      <ActivityOverlayModal
        insets={insets}
        activityMessage={
          languageLoading
            ? t("activity.loadingLanguages")
            : translationLoading
              ? t("activity.loadingTranslation")
              : null
        }
        visible={languageLoading || translationLoading}
      />
    </SafeAreaView>
  );
}
