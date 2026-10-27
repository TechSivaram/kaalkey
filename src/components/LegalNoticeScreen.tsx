import type { Dispatch, SetStateAction } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import LegalDocumentContent from "./LegalDocumentContent";
import LegalDocumentTabs from "./LegalDocumentTabs";
import LegalNoticeFooter from "./LegalNoticeFooter";
import LegalNoticeHeader from "./LegalNoticeHeader";

type LegalDocument = "privacy" | "terms";
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
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#F5F7FB" }}
          edges={["top", "right", "bottom", "left"]}
        >
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
            <LegalNoticeHeader firstLaunch={firstLaunch} />
            <LegalDocumentTabs
              legalDocument={legalDocument}
              setLegalDocument={setLegalDocument}
            />
            <ScrollView
              style={{
                flex: 1,
                backgroundColor: COLORS.white,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#E0E6EF",
              }}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              <LegalDocumentContent legalDocument={legalDocument} />
            </ScrollView>
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
