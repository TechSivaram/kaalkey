import { StyleSheet } from "react-native";
export const languageOptionStyles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E8EDF2",
  },
  optionSelected: { backgroundColor: "#178443" },
  primary: { color: "#243447", fontWeight: "700" },
  primarySelected: { color: "#FFFFFF" },
  secondary: { color: "#536477", fontSize: 12 },
  secondarySelected: { color: "#EAF7EF" },
  check: { color: "#FFFFFF", fontWeight: "800" },
});
