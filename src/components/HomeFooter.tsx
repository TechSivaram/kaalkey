import { useAppLanguage } from "../i18n";
import { Text, View } from "react-native";
import Constants from "expo-constants";
import { styles } from "../styles/home.styles";

/** Branded footer shown beneath the authenticator account list. */
export default function HomeFooter() {
  const { t } = useAppLanguage();
  return (
    <View style={styles.footer}>
      <Text style={styles.footerBrand}>{t("KAALKEY AUTHENTICATOR")}</Text>
      <Text style={styles.footerText}>{t("Your codes. Your device. Your control.")}</Text>
      <Text style={styles.version}>
        {t("VERSION")} {Constants.expoConfig?.version ?? "—"}
      </Text>
    </View>
  );
}
