import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { styles } from "../styles/home.styles";
import { useAppLanguage } from "../i18n";

const getFeatures = (t: (key: string) => string) => [
  {
    number: "01",
    title: t("productInfo.timeBasedCodes"),
    description: t("productInfo.generateOneTimeCodes"),
  },
  {
    number: "02",
    title: t("productInfo.quickAccountSetup"),
    description: t("productInfo.quickSetupDescription"),
  },
  {
    number: "03",
    title: t("productInfo.accountsOnePlace"),
    description: t("productInfo.accountsInOnePlaceDescription"),
  },
  {
    number: "04",
    title: t("productInfo.backupRestore"),
    description: t("productInfo.backupRestoreDescription"),
  },
  {
    number: "05",
    title: t("productInfo.privateAccountVault"),
    description: t("productInfo.privateVaultDescription"),
  },
  {
    number: "06",
    title: t("productInfo.easyCodeAccess"),
    description: t("productInfo.easyCodeAccessDescription"),
  },
];

export default function DesktopProductInfo() {
  const { t } = useAppLanguage();
  const FEATURES = getFeatures(t);
  return (
    <ScrollView
      style={styles.desktopInfoScroll}
      contentContainerStyle={styles.desktopInfoContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.desktopInfoInner}>
        <View style={styles.desktopBannerFrame}>
          <Image
            source={require("../../assets/images/kaalkey-brand-banner.png")}
            style={styles.desktopBrandBanner}
            resizeMode="contain"
            accessibilityLabel={t("productInfo.brandBanner")}
          />
        </View>
        <View style={styles.desktopInfoHeader}>
          <Image
            source={require("../../assets/images/kaalkey-logo-opaque.png")}
            style={styles.desktopOfficialLogo}
            resizeMode="contain"
            accessibilityLabel={t("productInfo.logo")}
          />
          <Text style={styles.desktopBrandTag}>{t("productInfo.authenticatorTechsivaram")}</Text>
        </View>

        <View style={styles.desktopHero}>
          <Text style={styles.desktopEyebrow}>{t("productInfo.mobileAuthenticator")}</Text>
          <Text style={styles.desktopHeroTitle}>{t("productInfo.tagline")}</Text>
          <Text style={styles.desktopHeroDescription}>{t("productInfo.heroDescription")}</Text>
          <View style={styles.desktopHeroPills}>
            <Text style={styles.desktopHeroPill}>{t("productInfo.timeBasedCodes2")}</Text>
            <Text style={styles.desktopHeroPill}>{t("productInfo.privateDesign")}</Text>
          </View>
        </View>

        <View style={styles.desktopFeatureHeading}>
          <Text style={styles.desktopSectionEyebrow}>
            {t("productInfo.builtSimpleAuthenticator")}
          </Text>
          <Text style={styles.desktopSectionTitle}>{t("productInfo.qrSetupTimed")}</Text>
        </View>

        <View style={styles.desktopFeatureGrid}>
          {FEATURES.map((feature) => (
            <View key={feature.number} style={styles.desktopFeatureCard}>
              <Text style={styles.desktopFeatureNumber}>{feature.number}</Text>
              <Text style={styles.desktopFeatureTitle}>{feature.title}</Text>
              <Text style={styles.desktopFeatureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.desktopPrivacyNote}>
          <Text style={styles.desktopPrivacyTitle}>{t("productInfo.privacyTitle")}</Text>
          <Text style={styles.desktopPrivacyDescription}>
            {t("productInfo.privacyDescription")}
          </Text>
        </View>

        <Text style={styles.desktopInfoFooter}>{t("productInfo.authenticator")}</Text>
      </View>
    </ScrollView>
  );
}
