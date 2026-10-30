import { Image, Text, View } from "react-native";
import { legalNoticeHeaderStyles as inlineStyles } from "../styles/component.styles";
import { useAppLanguage } from "../i18n";

type Props = { firstLaunch: boolean };

/** Branded legal-screen header and introductory copy. */
export default function LegalNoticeHeader({ firstLaunch }: Props) {
  const { t } = useAppLanguage();
  return (
    <>
      <View style={inlineStyles.row}>
        <Image
          source={require("../../assets/images/kaalkey-emblem.png")}
          style={inlineStyles.emblem}
          resizeMode="contain"
          accessibilityLabel={t("Original multicolour KaalKey authenticator emblem")}
        />
        <View style={inlineStyles.copy}>
          <Text style={inlineStyles.brand}>
            <Text style={inlineStyles.saffron}>Kaal</Text>
            <Text style={inlineStyles.blue}>K</Text>
            <Text style={inlineStyles.green}>ey</Text>
          </Text>
          <Text style={inlineStyles.subtitle}>{t("AUTHENTICATOR")}</Text>
          <View style={inlineStyles.badge}>
            <View style={inlineStyles.dot} />
            <Text style={inlineStyles.badgeText}>{t("LOCAL VAULT")}</Text>
          </View>
        </View>
      </View>
      <Text style={inlineStyles.title}>
        {firstLaunch ? t("Legal & Privacy Notice") : t("Legal information")}
      </Text>
      <Text style={inlineStyles.description}>
        {firstLaunch
          ? t(
              "Please review both documents before using KaalKey. They are included in the app and available offline.",
            )
          : t("Review KaalKey’s privacy information and terms of use.")}
      </Text>
    </>
  );
}
