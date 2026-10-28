import { ScrollView } from "react-native";
import LegalDocumentContent from "./LegalDocumentContent";
import type { LegalDocument } from "../types/legalDocument";
import { legalDocumentScrollPanelStyles } from "../styles/component.styles";

type Props = { legalDocument: LegalDocument };

/** Scrollable surface that displays the selected legal document. */
export default function LegalDocumentScrollPanel({ legalDocument }: Props) {
  return (
    <ScrollView
      style={legalDocumentScrollPanelStyles.panel}
      contentContainerStyle={legalDocumentScrollPanelStyles.content}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
    >
      <LegalDocumentContent legalDocument={legalDocument} />
    </ScrollView>
  );
}
