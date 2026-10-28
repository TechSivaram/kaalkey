import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/home.styles";

/** Branded startup screen shown while initial app checks run. */
export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.splashScreen} edges={["top", "right", "bottom", "left"]}>
      <View style={styles.splashBrandCard}>
        <Image
          source={require("../../assets/images/kaalkey-full-logo-white.png")}
          style={styles.splashLogo}
          resizeMode="contain"
          accessibilityLabel="KaalKey tricolour lock emblem"
        />
        <Text style={styles.splashTitle}>
          <Text style={styles.splashKaal}>Kaal</Text>
          <Text style={styles.splashK}>K</Text>
          <Text style={styles.splashEy}>ey</Text>
        </Text>
        <Text style={styles.splashSubtitle}>AUTHENTICATOR</Text>
        <View style={styles.splashBadge}>
          <View style={styles.splashDot} />
          <Text style={styles.splashBadgeText}>YOUR LOCAL VAULT</Text>
        </View>
        <View style={styles.splashDivider} />
        <Text style={styles.splashTagline}>Your codes. Your device. Your control.</Text>
      </View>
    </SafeAreaView>
  );
}
