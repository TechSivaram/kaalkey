import { ScrollView, StyleSheet } from "react-native";
import LegalDocumentContent from "./LegalDocumentContent";
import type { LegalDocument } from "../types/legalDocument";

type Props = { legalDocument: LegalDocument };

/** Scrollable surface that displays the selected legal document. */
export default function LegalDocumentScrollPanel({ legalDocument }: Props) {
  const inlineStyles = StyleSheet.create({
    inline1: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E0E6EF",
    },
  });
  return (
    <ScrollView
      style={inlineStyles.inline1}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
    >
      <LegalDocumentContent legalDocument={legalDocument} />
    </ScrollView>
  );
}
