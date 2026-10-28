import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { LegalDocument } from "../types/legalDocument";
import { getLegalDocumentTabStyles } from "../styles/component.styles";

type Props = {
  legalDocument: LegalDocument;
  setLegalDocument: Dispatch<SetStateAction<LegalDocument>>;
};

/** Privacy-policy and terms tabs in the legal notice screen. */
export default function LegalDocumentTabs({ legalDocument, setLegalDocument }: Props) {
  const inlineStyles = getLegalDocumentTabStyles(legalDocument);
  return (
    <View style={inlineStyles.tabs}>
      <TouchableOpacity onPress={() => setLegalDocument("privacy")} style={inlineStyles.privacyTab}>
        <Text style={inlineStyles.privacyText}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLegalDocument("terms")} style={inlineStyles.termsTab}>
        <Text style={inlineStyles.termsText}>Terms of Use</Text>
      </TouchableOpacity>
    </View>
  );
}
