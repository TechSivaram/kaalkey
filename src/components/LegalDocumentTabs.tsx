import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import type { LegalDocument } from "../types/legalDocument";

type Props = {
  legalDocument: LegalDocument;
  setLegalDocument: Dispatch<SetStateAction<LegalDocument>>;
};

/** Privacy-policy and terms tabs in the legal notice screen. */
export default function LegalDocumentTabs({ legalDocument, setLegalDocument }: Props) {
  const inlineStyles = StyleSheet.create({
    inline1: { flexDirection: "row", gap: 8, marginBottom: 10 },
    inline2: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor:
        legalDocument === "privacy" ? COLORS.legalNavy : COLORS.legalTabInactiveSurface,
      alignItems: "center",
    },
    inline3: {
      color: legalDocument === "privacy" ? COLORS.white : COLORS.legalTabInactiveText,
      fontWeight: "700",
    },
    inline4: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor:
        legalDocument === "terms" ? COLORS.legalNavy : COLORS.legalTabInactiveSurface,
      alignItems: "center",
    },
    inline5: {
      color: legalDocument === "terms" ? COLORS.white : COLORS.legalTabInactiveText,
      fontWeight: "700",
    },
  });
  return (
    <View style={inlineStyles.inline1}>
      <TouchableOpacity onPress={() => setLegalDocument("privacy")} style={inlineStyles.inline2}>
        <Text style={inlineStyles.inline3}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLegalDocument("terms")} style={inlineStyles.inline4}>
        <Text style={inlineStyles.inline5}>Terms of Use</Text>
      </TouchableOpacity>
    </View>
  );
}
