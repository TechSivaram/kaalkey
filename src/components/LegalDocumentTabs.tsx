import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { LegalDocument } from "../types/legalDocument";
import { getLegalDocumentTabStyles } from "../styles/component.styles";
import { useAppLanguage } from "../i18n";

type Props = {
  legalDocument: LegalDocument;
  setLegalDocument: Dispatch<SetStateAction<LegalDocument>>;
};

/** Privacy-policy and terms tabs in the legal notice screen. */
export default function LegalDocumentTabs({ legalDocument, setLegalDocument }: Props) {
  const inlineStyles = getLegalDocumentTabStyles(legalDocument);
  const { t } = useAppLanguage();
  return (
    <View style={inlineStyles.tabs}>
      <TouchableOpacity onPress={() => setLegalDocument("privacy")} style={inlineStyles.privacyTab}>
        <Text style={inlineStyles.privacyText}>{t("legal.privacy.title")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setLegalDocument("terms")} style={inlineStyles.termsTab}>
        <Text style={inlineStyles.termsText}>{t("legal.terms.title")}</Text>
      </TouchableOpacity>
    </View>
  );
}
