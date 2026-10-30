import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { styles } from "../styles/home.styles";
import { useAppLanguage } from "../i18n";

const getFeatures = (t: (key: string) => string) => [
  {
    number: "01",
    title: t("Time-based codes"),
    description: t(
      "Generate rotating one-time passcodes for your accounts to complete two-step verification.",
    ),
  },
  {
    number: "02",
    title: t("Quick account setup"),
    description: t("Scan an authenticator QR code or import a QR image to add an account."),
  },
  {
    number: "03",
    title: t("Accounts in one place"),
    description: t(
      "Keep your saved accounts together and find the right entry when it is time to sign in.",
    ),
  },
  {
    number: "04",
    title: t("Backup & restore"),
    description: t(
      "Back up your authenticator data and restore it when you move to another device.",
    ),
  },
  {
    number: "05",
    title: t("Private account vault"),
    description: t(
      "Manage your authenticator entries locally and use the app's available device-lock option.",
    ),
  },
  {
    number: "06",
    title: t("Easy code access"),
    description: t(
      "Copy a current code or manage account details through a clean, focused interface.",
    ),
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
            accessibilityLabel={t("KaalKey brand banner")}
          />
        </View>
        <View style={styles.desktopInfoHeader}>
          <Image
            source={require("../../assets/images/kaalkey-logo-opaque.png")}
            style={styles.desktopOfficialLogo}
            resizeMode="contain"
            accessibilityLabel={t("KaalKey logo")}
          />
          <Text style={styles.desktopBrandTag}>{t("AUTHENTICATOR · BY TECHSIVARAM")}</Text>
        </View>

        <View style={styles.desktopHero}>
          <Text style={styles.desktopEyebrow}>{t("YOUR MOBILE AUTHENTICATOR")}</Text>
          <Text style={styles.desktopHeroTitle}>
            {t("A simpler way to manage your two-step verification.")}
          </Text>
          <Text style={styles.desktopHeroDescription}>
            {t(
              "A focused authenticator experience for time-based verification codes. Keep compatible account codes close at hand with KaalKey for Android.",
            )}
          </Text>
          <View style={styles.desktopHeroPills}>
            <Text style={styles.desktopHeroPill}>{t("TIME-BASED CODES")}</Text>
            <Text style={styles.desktopHeroPill}>{t("PRIVATE BY DESIGN")}</Text>
          </View>
        </View>

        <View style={styles.desktopFeatureHeading}>
          <Text style={styles.desktopSectionEyebrow}>
            {t("BUILT FOR A SIMPLE AUTHENTICATOR WORKFLOW")}
          </Text>
          <Text style={styles.desktopSectionTitle}>
            {t("QR SETUP · TIMED CODES · ACCOUNT MANAGEMENT")}
          </Text>
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
          <Text style={styles.desktopPrivacyTitle}>
            {t("Your accounts. Your codes. Your control.")}
          </Text>
          <Text style={styles.desktopPrivacyDescription}>
            {t(
              "Keep your verification accounts in one place. Use the app's backup, restore, and device-lock options to manage your setup responsibly.",
            )}
          </Text>
        </View>

        <Text style={styles.desktopInfoFooter}>{t("KAALKEY · AUTHENTICATOR")}</Text>
      </View>
    </ScrollView>
  );
}
