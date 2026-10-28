import { Image, Text, View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

type Props = { firstLaunch: boolean };

/** Branded legal-screen header and introductory copy. */
export default function LegalNoticeHeader({ firstLaunch }: Props) {
  const inlineStyles = StyleSheet.create({
    inline1: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      marginBottom: 18,
      paddingVertical: 2,
    },
    inline2: { width: 88, height: 80 },
    inline3: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
    inline4: { fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: 0.1 },
    inline5: { color: COLORS.saffron },
    inline6: { color: COLORS.linkBlue },
    inline7: { color: COLORS.successGreen },
    inline8: {
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 2.1,
      color: COLORS.secondaryText,
      fontWeight: "800",
      marginTop: 1,
    },
    inline9: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 7,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: "#D6E0EE",
      borderRadius: 16,
      backgroundColor: COLORS.white,
    },
    inline10: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.successGreen,
    },
    inline11: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      color: COLORS.legalSecondaryText,
    },
    inline12: { fontSize: 23, fontWeight: "800", color: "#14233D", marginBottom: 6 },
    inline13: {
      fontSize: 13,
      lineHeight: 19,
      color: COLORS.legalSecondaryText,
      marginBottom: 12,
    },
  });
  return (
    <>
      <View style={inlineStyles.inline1}>
        <Image
          source={require("../../assets/images/kaalkey-emblem.png")}
          style={inlineStyles.inline2}
          resizeMode="contain"
          accessibilityLabel="Original multicolour KaalKey authenticator emblem"
        />
        <View style={inlineStyles.inline3}>
          <Text style={inlineStyles.inline4}>
            <Text style={inlineStyles.inline5}>Kaal</Text>
            <Text style={inlineStyles.inline6}>K</Text>
            <Text style={inlineStyles.inline7}>ey</Text>
          </Text>
          <Text style={inlineStyles.inline8}>AUTHENTICATOR</Text>
          <View style={inlineStyles.inline9}>
            <View style={inlineStyles.inline10} />
            <Text style={inlineStyles.inline11}>LOCAL VAULT</Text>
          </View>
        </View>
      </View>
      <Text style={inlineStyles.inline12}>
        {firstLaunch ? "Legal & Privacy Notice" : "Legal information"}
      </Text>
      <Text style={inlineStyles.inline13}>
        {firstLaunch
          ? "Please review both documents before using KaalKey. They are included in the app and available offline."
          : "Review KaalKey’s privacy information and terms of use."}
      </Text>
    </>
  );
}
