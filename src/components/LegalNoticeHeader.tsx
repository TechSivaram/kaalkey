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
          accessibilityLabel={t("legal.originalMulticolourAuthenticator")}
        />
        <View style={inlineStyles.copy}>
          <Text style={inlineStyles.brand}>
            <Text style={inlineStyles.saffron}>Kaal</Text>
            <Text style={inlineStyles.blue}>K</Text>
            <Text style={inlineStyles.green}>ey</Text>
          </Text>
          <Text style={inlineStyles.subtitle}>{t("home.authenticator2")}</Text>
          <View style={inlineStyles.badge}>
            <View style={inlineStyles.dot} />
            <Text style={inlineStyles.badgeText}>{t("home.localVault2")}</Text>
          </View>
        </View>
      </View>
      <Text style={inlineStyles.title}>
        {firstLaunch ? t("legal.legalPrivacyNotice") : t("legal.legalInformation")}
      </Text>
      <Text style={inlineStyles.description}>
        {firstLaunch ? t("legal.reviewBothDocuments") : t("legal.reviewSPrivacy")}
      </Text>
    </>
  );
}
