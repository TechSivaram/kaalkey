import type { Dispatch, SetStateAction } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LegalDocumentScrollPanel from "./LegalDocumentScrollPanel";
import LegalDocumentTabs from "./LegalDocumentTabs";
import LegalNoticeFooter from "./LegalNoticeFooter";
import LegalNoticeHeader from "./LegalNoticeHeader";
import type { LegalDocument } from "../types/legalDocument";
import { legalNoticeScreenStyles } from "../styles/component.styles";

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
  return (
    <SafeAreaView style={legalNoticeScreenStyles.screen} edges={["top", "right", "bottom", "left"]}>
      <View style={legalNoticeScreenStyles.content}>
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
