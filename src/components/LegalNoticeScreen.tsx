import type { Dispatch, SetStateAction } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LegalDocumentScrollPanel from "./LegalDocumentScrollPanel";
import LegalDocumentTabs from "./LegalDocumentTabs";
import LegalNoticeFooter from "./LegalNoticeFooter";
import LegalNoticeHeader from "./LegalNoticeHeader";
import type { LegalDocument } from "../types/legalDocument";

type Props = {
  firstLaunch: boolean;
  legalDocument: LegalDocument;
  setLegalDocument: Dispatch<SetStateAction<LegalDocument>>;
  legalChecked: boolean;
  setLegalChecked: Dispatch<SetStateAction<boolean>>;
  legalSaving: boolean;
  onAccept: () => void;
  onDone: () => void;
};

/** First-launch consent screen and the in-app legal document viewer. */
export default function LegalNoticeScreen({
  firstLaunch,
  legalDocument,
  setLegalDocument,
  legalChecked,
  setLegalChecked,
  legalSaving,
  onAccept,
  onDone,
}: Props) {
  const inlineStyles = StyleSheet.create({
    inline1: { flex: 1, backgroundColor: "#F5F7FB" },
    inline2: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  });
  return (
    <SafeAreaView style={inlineStyles.inline1} edges={["top", "right", "bottom", "left"]}>
      <View style={inlineStyles.inline2}>
        <LegalNoticeHeader firstLaunch={firstLaunch} />
        <LegalDocumentTabs legalDocument={legalDocument} setLegalDocument={setLegalDocument} />
        <LegalDocumentScrollPanel legalDocument={legalDocument} />
        <LegalNoticeFooter
          firstLaunch={firstLaunch}
          legalChecked={legalChecked}
          setLegalChecked={setLegalChecked}
          legalSaving={legalSaving}
          onAccept={onAccept}
          onDone={onDone}
        />
      </View>
    </SafeAreaView>
  );
}
