import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getLegalNoticeFooterStyles } from "../styles/component.styles";

type Props = {
  firstLaunch: boolean;
  legalChecked: boolean;
  setLegalChecked: Dispatch<SetStateAction<boolean>>;
  legalSaving: boolean;
  onAccept: () => void;
  onDone: () => void;
};

/** Consent checkbox and accept/done actions for the legal notice screen. */
export default function LegalNoticeFooter({
  firstLaunch,
  legalChecked,
  setLegalChecked,
  legalSaving,
  onAccept,
  onDone,
}: Props) {
  const inlineStyles = getLegalNoticeFooterStyles(legalChecked);
  if (firstLaunch) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setLegalChecked((value) => !value)}
          style={inlineStyles.row}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: legalChecked }}
        >
          <View style={inlineStyles.checkbox}>
            <Text style={inlineStyles.checkmark}>{legalChecked ? "✓" : ""}</Text>
          </View>
          <Text style={inlineStyles.agreement}>
            I have read and agree to the Privacy Policy and Terms of Use.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!legalChecked || legalSaving}
          onPress={onAccept}
          style={inlineStyles.accept}
        >
          <Text style={inlineStyles.acceptText}>
            {legalSaving ? "Saving…" : "Accept & Continue"}
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <TouchableOpacity onPress={onDone} style={inlineStyles.done}>
      <Text style={inlineStyles.doneText}>Done</Text>
    </TouchableOpacity>
  );
}
