import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  splashScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F4F7FA",
  },
  splashBrandCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#14213D",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  splashLogo: { width: 116, height: 116, marginBottom: 12 },
  splashTitle: { fontSize: 42, fontWeight: "900", letterSpacing: -1.2 },
  splashKaal: { color: "#D98200" },
  splashK: { color: "#173D75" },
  splashEy: { color: "#138808" },
  splashSubtitle: { marginTop: 4, color: "#344054", fontSize: 13, fontWeight: "800", letterSpacing: 4.2 },
  splashBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 22, borderWidth: 1, borderColor: "#DCE5EC", backgroundColor: "#F8FAFC" },
  splashDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#138808" },
  splashBadgeText: { color: "#475467", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  splashDivider: { width: 84, height: 4, borderRadius: 2, marginTop: 28, backgroundColor: "#FF9800" },
  splashTagline: { marginTop: 18, color: "#667085", fontSize: 13, fontWeight: "600", textAlign: "center" },

  settingsIconButton: {
    width: 38,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 22, color: "#263449", fontWeight: "700" },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "center",
  },
  settingsSheet: {
    width: "100%",
    maxHeight: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "#E5EAF1",
    overflow: "hidden",
  },
  settingsScroll: { flexShrink: 1 },
  settingsScrollContent: { paddingBottom: 18 },
  settingsTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  settingsEyebrow: { fontSize: 10, letterSpacing: 1.8, fontWeight: "800", color: "#138808", marginBottom: 5 },
  settingsTitle: { fontSize: 26, fontWeight: "900", color: "#172033" },
  settingsCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F4F8", alignItems: "center", justifyContent: "center" },
  settingsCloseText: { fontSize: 16, fontWeight: "800", color: "#344054" },
  settingsSectionLabel: { color: "#7A8698", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 9, marginTop: 8 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#EEF1F5", gap: 12 },
  settingIconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F3F6FA", alignItems: "center", justifyContent: "center" },
  settingIcon: { fontSize: 20 },
  settingCopy: { flex: 1 },
  settingTitleText: { fontSize: 14, fontWeight: "800", color: "#172033", marginBottom: 3 },
  settingDescription: { fontSize: 11, lineHeight: 16, color: "#697586" },
  settingSwitch: { width: 46, height: 27, borderRadius: 14, backgroundColor: "#D7DDE6", padding: 3, justifyContent: "center" },
  settingSwitchOn: { backgroundColor: "#138808" },
  settingSwitchThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#FFFFFF", elevation: 2, alignSelf: "flex-start" },
  settingSwitchThumbOn: { alignSelf: "flex-end" },
  appearanceBadge: { borderRadius: 8, backgroundColor: "#EAF8EE", paddingHorizontal: 9, paddingVertical: 6 },
  appearanceBadgeText: { fontSize: 9, fontWeight: "900", color: "#138808", letterSpacing: 0.6 },
  backupButtonsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  backupActionButton: { flex: 1, minHeight: 106, borderRadius: 15, borderWidth: 1, borderColor: "#DCE5F0", backgroundColor: "#FFFFFF", padding: 13, alignItems: "flex-start", justifyContent: "center" },
  backupActionIcon: { fontSize: 21, color: "#138808", marginBottom: 7, fontWeight: "800" },
  backupActionTitle: { color: "#17243A", fontSize: 13, fontWeight: "800" },
  backupActionDescription: { color: "#77859A", fontSize: 11, marginTop: 4 },
  backupSafetyText: { color: "#7B5B24", fontSize: 11, lineHeight: 16, marginTop: 9 },
  backupModalWrap: { flex: 1, justifyContent: "flex-end" },
  backupModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30, borderWidth: 1, borderColor: "#E7EDF5" },
  backupModalDescription: { color: "#5E6C82", fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  backupDisabled: { opacity: 0.6 },

  settingsPrivacyNote: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 22, padding: 13, backgroundColor: "#F5F8FC", borderRadius: 14, borderWidth: 1, borderColor: "#E7EDF5" },
  settingsPrivacyIcon: { fontSize: 20 },
  settingsPrivacyText: { flex: 1, color: "#596579", fontSize: 11, lineHeight: 16 },
  settingsDoneButton: { marginTop: 18, borderRadius: 15, backgroundColor: "#FF9800", paddingVertical: 15, alignItems: "center" },
  settingsDoneText: { color: "#101827", fontWeight: "900", fontSize: 14 },
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },

  tricolorStripe: {
    height: 3,
    flexDirection: "row",
  },

  tricolorSegment: {
    flex: 1,
  },

  securityButton: {
    minWidth: 66,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#F8FAFC",
  },
  securityButtonActive: {
    borderColor: "#B7E3C2",
    backgroundColor: "#EFFAF1",
  },
  securityButtonIcon: {
    fontSize: 17,
    marginBottom: 3,
  },
  securityButtonText: {
    color: "#526075",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  securityButtonTextActive: {
    color: "#138808",
  },
  lockScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  lockCard: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E1E6ED",
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 28,
  },
  lockIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#FFF2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  lockIcon: { fontSize: 34 },
  lockBrand: {
    color: "#172033",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 10,
  },
  lockTitle: {
    color: "#172033",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  lockDescription: {
    color: "#657186",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  unlockButton: {
    width: "100%",
    backgroundColor: "#FF9800",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  unlockButtonText: {
    color: "#101827",
    fontSize: 13,
    fontWeight: "900",
  },
  lockFootnote: {
    color: "#8290A7",
    fontSize: 10,
    marginTop: 18,
    textAlign: "center",
  },

  header: {
    paddingTop: 8,
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EAF0",
  },

  brandRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  brandMarkFrame: {
    width: 88,
    height: 82,
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMark: {
    width: "100%",
    height: "100%",
  },

  brandTextBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  brandName: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  brandKaal: {
    color: "#FF9800",
  },

  brandK: {
    color: "#1769E0",
  },

  brandEy: {
    color: "#168A35",
  },

  brandSubtitle: {
    marginTop: 1,
    marginBottom: 7,
    color: "#4B5563",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.1,
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D8E1EA",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
  },

  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#138808",
  },

  secureText: {
    color: "#516074",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 48,
  },

  intro: {
    marginTop: 4,
    marginBottom: 26,
    padding: 21,
    paddingTop: 22,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#26344A",
    backgroundColor: "#101A2B",
    overflow: "hidden",
  },

  eyebrow: {
    color: "#FF9800",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 11,
  },

  heading: {
    color: "#F4F6FB",
    fontSize: 37,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1.4,
  },

  description: {
    color: "#A0AEC2",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 11,
    maxWidth: 300,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  organizePanel: {
    marginBottom: 16,
  },

  searchInputContainer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#FFFFFF",
  },

  searchInput: {
    flex: 1,
    minHeight: 44,
    color: "#172033",
    paddingLeft: 14,
    paddingRight: 4,
    fontSize: 13,
  },

  clearSearchButton: {
    width: 40,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  clearSearchButtonText: {
    color: "#9A4D00",
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "400",
  },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  sortLabel: {
    color: "#778397",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginRight: 3,
  },

  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#FFCC80",
    backgroundColor: "#FFFFFF",
  },

  sortButtonActive: {
    borderColor: "#FF9800",
    backgroundColor: "#FFF7ED",
  },

  sortButtonText: {
    color: "#596579",
    fontSize: 11,
    fontWeight: "700",
  },

  sortButtonTextActive: {
    color: "#9A4D00",
  },

  accountActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editButton: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
    backgroundColor: "#FFF7ED",
  },

  editButtonText: {
    color: "#9A4D00",
    fontSize: 11,
    fontWeight: "700",
  },

  sectionTitle: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  accountCount: {
    color: "#778397",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  addButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 13,
    shadowColor: "#C96D00",
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  addButtonText: {
    color: "#101827",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: "#E1E6ED",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFF0DD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyIconText: {
    color: "#FF9800",
    fontSize: 30,
  },

  emptyTitle: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 9,
  },

  emptyText: {
    color: "#657186",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: "#FF9800",
    borderRadius: 14,
    minHeight: 51,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 21,
    shadowColor: "#C96D00",
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  primaryButtonText: {
    color: "#101827",
    fontSize: 14,
    fontWeight: "800",
  },

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E6EE",
    borderRadius: 20,
    padding: 16,
    marginBottom: 13,
    shadowColor: "#18263B",
    shadowOpacity: 0.075,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFF0DD",
    borderWidth: 1,
    borderColor: "#F5D4AD",
    alignItems: "center",
    justifyContent: "center",
  },

  accountIconText: {
    color: "#B95D00",
    fontSize: 20,
    fontWeight: "900",
  },

  accountInfo: {
    flex: 1,
  },

  accountIssuer: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
  },

  accountName: {
    color: "#68758A",
    fontSize: 12,
    marginTop: 4,
  },

  deleteIcon: {
    color: "#8A95A6",
    fontSize: 28,
    paddingHorizontal: 5,
  },

  codeRow: {
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8ECF2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  codeArea: {
    flex: 1,
    minWidth: 0,
  },

  countdownRing: {
    width: 56,
    height: 56,
    marginLeft: 12,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#F0F4F8",
  },

  countdownDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  countdownNumber: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  code: {
    color: "#172033",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 3,
    fontVariant: ["tabular-nums"],
  },

  copyHint: {
    color: "#B95D00",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 8,
  },

  footer: {
    marginTop: 37,
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E0E6EE",
  },

  footerBrand: {
    color: "#566276",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  footerText: {
    color: "#7A8597",
    fontSize: 12,
    marginTop: 9,
  },

  version: {
    color: "#98A1AF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 15,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 29, 47, 0.45)",
    justifyContent: "center",
    padding: 16,
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0E6EE",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },

  modalHeaderCopy: { flex: 1, minWidth: 0 },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F4F8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },

  modalTitle: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#68758A",
    fontSize: 12,
    marginTop: 7,
  },

  closeButton: {
    color: "#344054",
    fontSize: 27,
    lineHeight: 30,
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
  },

  inputLabel: {
    color: "#566276",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 9,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DCE2EA",
    borderRadius: 11,
    color: "#172033",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },

  securityNote: {
    color: "#68758A",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 15,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderColor: "#FF9800",
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    marginBottom: 19,
    gap: 12,
  },

  scanButtonIcon: {
    color: "#FF9800",
    fontSize: 28,
    fontWeight: "800",
  },

  scanButtonCopy: {
    flex: 1,
  },

  scanButtonTitle: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "800",
  },

  scanButtonSubtitle: {
    color: "#68758A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  scanButtonArrow: {
    color: "#FF9800",
    fontSize: 28,
  },

  manualEntryLabel: {
    color: "#7A8597",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 2,
    marginBottom: 3,
  },

  scannerContainer: {
    flex: 1,
    backgroundColor: "#080D18",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 42 : 58,
    paddingBottom: 28,
  },

  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scannerBack: {
    color: "#FF9800",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 8,
  },

  scannerStep: {
    color: "#8290A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
  },

  scannerIntro: {
    marginTop: 28,
    marginBottom: 24,
  },

  scannerTitle: {
    color: "#F5F7FC",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  scannerSubtitle: {
    color: "#8E9BB0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  cameraFrame: {
    width: "100%",
    height: 330,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#314451",
    backgroundColor: "#111B2B",
  },

  cameraPreview: {
    width: "100%",
    height: "100%",
  },

  cameraUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#111B2B",
  },

  cameraUnavailableText: {
    color: "#D5DCE8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  scanCornerTL: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FF9800",
    borderTopLeftRadius: 9,
  },

  scanCornerTR: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FF9800",
    borderTopRightRadius: 9,
  },

  scanCornerBL: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FF9800",
    borderBottomLeftRadius: 9,
  },

  scanCornerBR: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FF9800",
    borderBottomRightRadius: 9,
  },

  scannerHint: {
    color: "#8290A7",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 18,
  },

  scannerManualButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 10,
  },

  scannerManualText: {
    color: "#FF9800",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF9800",
    backgroundColor: "#FFF7ED",
  },

  cancelButtonText: {
    color: "#9A4D00",
    fontSize: 13,
    fontWeight: "700",
  },
});
