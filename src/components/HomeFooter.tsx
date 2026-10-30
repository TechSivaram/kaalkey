import { Text, View } from "react-native";
import Constants from "expo-constants";
import { styles } from "../styles/home.styles";

/** Branded footer shown beneath the authenticator account list. */
export default function HomeFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerBrand}>KAALKEY AUTHENTICATOR</Text>
      <Text style={styles.footerText}>Your codes. Your device. Your control.</Text>
      <Text style={styles.version}>VERSION {Constants.expoConfig?.version ?? "—"}</Text>
    </View>
  );
}
