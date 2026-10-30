import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { styles } from "../styles/home.styles";

const FEATURES = [
  {
    number: "01",
    title: "Time-based codes",
    description:
      "Generate rotating one-time passcodes for your accounts to complete two-step verification.",
  },
  {
    number: "02",
    title: "Quick account setup",
    description: "Scan an authenticator QR code or import a QR image to add an account.",
  },
  {
    number: "03",
    title: "Accounts in one place",
    description:
      "Keep your saved accounts together and find the right entry when it is time to sign in.",
  },
  {
    number: "04",
    title: "Backup & restore",
    description: "Back up your authenticator data and restore it when you move to another device.",
  },
  {
    number: "05",
    title: "Private account vault",
    description:
      "Manage your authenticator entries locally and use the app's available device-lock option.",
  },
  {
    number: "06",
    title: "Easy code access",
    description:
      "Copy a current code or manage account details through a clean, focused interface.",
  },
];

export default function DesktopProductInfo() {
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
            accessibilityLabel="KaalKey brand banner"
          />
        </View>
        <View style={styles.desktopInfoHeader}>
          <Image
            source={require("../../assets/images/kaalkey-logo-opaque.png")}
            style={styles.desktopOfficialLogo}
            resizeMode="contain"
            accessibilityLabel="KaalKey logo"
          />
          <Text style={styles.desktopBrandTag}>AUTHENTICATOR · BY TECHSIVARAM</Text>
        </View>

        <View style={styles.desktopHero}>
          <Text style={styles.desktopEyebrow}>YOUR MOBILE AUTHENTICATOR</Text>
          <Text style={styles.desktopHeroTitle}>
            A simpler way to manage your two-step verification.
          </Text>
          <Text style={styles.desktopHeroDescription}>
            A focused authenticator experience for time-based verification codes. Keep compatible
            account codes close at hand with KaalKey for Android.
          </Text>
          <View style={styles.desktopHeroPills}>
            <Text style={styles.desktopHeroPill}>TIME-BASED CODES</Text>
            <Text style={styles.desktopHeroPill}>PRIVATE BY DESIGN</Text>
          </View>
        </View>

        <View style={styles.desktopFeatureHeading}>
          <Text style={styles.desktopSectionEyebrow}>
            BUILT FOR A SIMPLE AUTHENTICATOR WORKFLOW
          </Text>
          <Text style={styles.desktopSectionTitle}>
            QR SETUP · TIMED CODES · ACCOUNT MANAGEMENT
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
          <Text style={styles.desktopPrivacyTitle}>Your accounts. Your codes. Your control.</Text>
          <Text style={styles.desktopPrivacyDescription}>
            Keep your verification accounts in one place. Use the app&apos;s backup, restore, and
            device-lock options to manage your setup responsibly.
          </Text>
        </View>

        <Text style={styles.desktopInfoFooter}>KAALKEY · AUTHENTICATOR</Text>
      </View>
    </ScrollView>
  );
}
