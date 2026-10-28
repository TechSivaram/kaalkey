import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

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
  const inlineStyles = StyleSheet.create({
    inline1: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
    inline2: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: legalChecked ? COLORS.legalAcceptedGreen : "#8997AA",
      backgroundColor: legalChecked ? COLORS.legalAcceptedGreen : COLORS.white,
      alignItems: "center",
      justifyContent: "center",
    },
    inline3: { color: COLORS.white, fontWeight: "800" },
    inline4: { flex: 1, color: "#34445D", fontSize: 12, lineHeight: 18 },
    inline5: {
      backgroundColor: legalChecked ? COLORS.legalNavy : "#AAB5C4",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginBottom: 4,
    },
    inline6: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
    inline7: {
      backgroundColor: COLORS.legalNavy,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 12,
    },
    inline8: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  });
  if (firstLaunch) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setLegalChecked((value) => !value)}
          style={inlineStyles.inline1}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: legalChecked }}
        >
          <View style={inlineStyles.inline2}>
            <Text style={inlineStyles.inline3}>{legalChecked ? "✓" : ""}</Text>
          </View>
          <Text style={inlineStyles.inline4}>
            I have read and agree to the Privacy Policy and Terms of Use.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!legalChecked || legalSaving}
          onPress={onAccept}
          style={inlineStyles.inline5}
        >
          <Text style={inlineStyles.inline6}>{legalSaving ? "Saving…" : "Accept & Continue"}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <TouchableOpacity onPress={onDone} style={inlineStyles.inline7}>
      <Text style={inlineStyles.inline8}>Done</Text>
    </TouchableOpacity>
  );
}
