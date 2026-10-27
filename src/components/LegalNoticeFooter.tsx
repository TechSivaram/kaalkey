import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
  firstLaunch, legalChecked, setLegalChecked, legalSaving, onAccept, onDone,
}: Props) {
  if (firstLaunch) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setLegalChecked((value) => !value)}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: legalChecked }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: legalChecked ? COLORS.legalAcceptedGreen : "#8997AA",
              backgroundColor: legalChecked ? COLORS.legalAcceptedGreen : COLORS.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "800" }}>
              {legalChecked ? "✓" : ""}
            </Text>
          </View>
          <Text style={{ flex: 1, color: "#34445D", fontSize: 12, lineHeight: 18 }}>
            I have read and agree to the Privacy Policy and Terms of Use.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!legalChecked || legalSaving}
          onPress={onAccept}
          style={{
            backgroundColor: legalChecked ? COLORS.legalNavy : "#AAB5C4",
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: "800" }}>
            {legalSaving ? "Saving…" : "Accept & Continue"}
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <TouchableOpacity
      onPress={onDone}
      style={{
        backgroundColor: COLORS.legalNavy,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 12,
      }}
    >
      <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: "800" }}>Done</Text>
    </TouchableOpacity>
  );
}
