import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";

type LegalDocument = "privacy" | "terms";
type Props = {
  legalDocument: LegalDocument;
  setLegalDocument: Dispatch<SetStateAction<LegalDocument>>;
};

/** Privacy-policy and terms tabs in the legal notice screen. */
export default function LegalDocumentTabs({ legalDocument, setLegalDocument }: Props) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
      <TouchableOpacity
        onPress={() => setLegalDocument("privacy")}
        style={{
          flex: 1,
          paddingVertical: 11,
          borderRadius: 12,
          backgroundColor: legalDocument === "privacy" ? COLORS.legalNavy : COLORS.legalTabInactiveSurface,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: legalDocument === "privacy" ? COLORS.white : COLORS.legalTabInactiveText,
            fontWeight: "700",
          }}
        >
          Privacy Policy
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setLegalDocument("terms")}
        style={{
          flex: 1,
          paddingVertical: 11,
          borderRadius: 12,
          backgroundColor: legalDocument === "terms" ? COLORS.legalNavy : COLORS.legalTabInactiveSurface,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: legalDocument === "terms" ? COLORS.white : COLORS.legalTabInactiveText,
            fontWeight: "700",
          }}
        >
          Terms of Use
        </Text>
      </TouchableOpacity>
    </View>
  );
}
