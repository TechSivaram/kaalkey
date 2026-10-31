import { useAppLanguage } from "../i18n";
import { Text, View } from "react-native";
import Constants from "expo-constants";
import { styles } from "../styles/home.styles";

/** Branded footer shown beneath the authenticator account list. */
export default function HomeFooter() {
  const { t } = useAppLanguage();
  return (
    <View style={styles.footer}>
      <Text style={styles.footerBrand}>{t("home.authenticator")}</Text>
      <Text style={styles.footerText}>{t("home.codesDeviceControl")}</Text>
      <Text style={styles.version}>
        {t("home.versionLabel")} {Constants.expoConfig?.version ?? "—"}
      </Text>
    </View>
  );
}
