import { Image, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

type Props = { firstLaunch: boolean };

/** Branded legal-screen header and introductory copy. */
export default function LegalNoticeHeader({ firstLaunch }: Props) {
  return (
    <>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          marginBottom: 18,
          paddingVertical: 2,
        }}
      >
        <Image
          source={require("../../assets/images/kaalkey-emblem.png")}
          style={{ width: 88, height: 80 }}
          resizeMode="contain"
          accessibilityLabel="Original multicolour KaalKey authenticator emblem"
        />
        <View style={{ flex: 1, alignItems: "flex-start", justifyContent: "center" }}>
          <Text style={{ fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: 0.1 }}>
            <Text style={{ color: COLORS.saffron }}>Kaal</Text>
            <Text style={{ color: COLORS.linkBlue }}>K</Text>
            <Text style={{ color: COLORS.successGreen }}>ey</Text>
          </Text>
          <Text
            style={{
              fontSize: 11,
              lineHeight: 16,
              letterSpacing: 2.1,
              color: COLORS.secondaryText,
              fontWeight: "800",
              marginTop: 1,
            }}
          >
            AUTHENTICATOR
          </Text>
          <View
            style={{
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
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: COLORS.successGreen,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 1,
                color: COLORS.legalSecondaryText,
              }}
            >
              LOCAL VAULT
            </Text>
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 23, fontWeight: "800", color: "#14233D", marginBottom: 6 }}>
        {firstLaunch ? "Legal & Privacy Notice" : "Legal information"}
      </Text>
      <Text
        style={{
          fontSize: 13,
          lineHeight: 19,
          color: COLORS.legalSecondaryText,
          marginBottom: 12,
        }}
      >
        {firstLaunch
          ? "Please review both documents before using KaalKey. They are included in the app and available offline."
          : "Review KaalKey’s privacy information and terms of use."}
      </Text>
    </>
  );
}
