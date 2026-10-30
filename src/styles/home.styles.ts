import { Platform, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import { COLORS } from "../constants/colors";

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
    backgroundColor: COLORS.white,
    shadowColor: "#14213D",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  splashLogo: { width: 116, height: 116, marginBottom: 12 },
  splashTitle: { fontSize: 42, fontWeight: "900", letterSpacing: -1.2 },
  splashKaal: { color: COLORS.saffronDark },
  splashK: { color: "#173D75" },
  splashEy: { color: COLORS.indiaGreen },
  splashSubtitle: {
    marginTop: 4,
    color: COLORS.slateDark,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4.2,
  },
  splashBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCE5EC",
    backgroundColor: COLORS.surfaceLight,
  },
  splashDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.indiaGreen },
  splashBadgeText: { color: "#475467", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  splashDivider: {
    width: 84,
    height: 4,
    borderRadius: 2,
    marginTop: 28,
    backgroundColor: COLORS.saffron,
  },
  splashTagline: {
    marginTop: 18,
    color: "#667085",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  settingsIconButton: {
    width: 38,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 22, color: "#263449", fontWeight: "700" },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "center",
    paddingVertical: 12,
  },
  settingsSheet: {
    width: "100%",
    maxHeight: "100%",
    flexShrink: 1,
    backgroundColor: COLORS.white,
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
  settingsTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  dialogTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  settingsEyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "800",
    color: COLORS.indiaGreen,
    marginBottom: 5,
  },
  settingsTitle: { fontSize: 26, fontWeight: "900", color: COLORS.textPrimary },
  settingsCloseButton: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: COLORS.homeSubtleSurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 4,
    zIndex: 2,
    elevation: 2,
  },
  settingsCloseText: { fontSize: 16, fontWeight: "800", color: COLORS.slateDark },
  settingsSectionLabel: {
    color: "#7A8698",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
    gap: 12,
  },
  settingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F3F6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  settingIcon: { fontSize: 20 },
  settingCopy: { flex: 1 },
  settingTitleText: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 3 },
  settingDescription: { fontSize: 11, lineHeight: 16, color: "#697586" },
  settingSwitch: {
    width: 46,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#D7DDE6",
    padding: 3,
    justifyContent: "center",
  },
  settingSwitchOn: { backgroundColor: COLORS.indiaGreen },
  settingSwitchThumb: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    elevation: 2,
    alignSelf: "flex-start",
  },
  settingSwitchThumbOn: { alignSelf: "flex-end" },
  appearanceBadge: {
    borderRadius: 8,
    backgroundColor: "#EAF8EE",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  appearanceBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.indiaGreen,
    letterSpacing: 0.6,
  },
  backupButtonsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  backupActionButton: {
    flex: 1,
    minHeight: 106,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DCE5F0",
    backgroundColor: COLORS.white,
    padding: 13,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backupActionIcon: { fontSize: 21, color: COLORS.indiaGreen, marginBottom: 7, fontWeight: "800" },
  backupActionTitle: { color: "#17243A", fontSize: 13, fontWeight: "800" },
  backupActionDescription: { color: "#77859A", fontSize: 11, marginTop: 4 },
  backupSafetyText: { color: "#7B5B24", fontSize: 11, lineHeight: 16, marginTop: 9 },
  backupModalWrap: { flex: 1, justifyContent: "center" },
  backupModalScroll: { flex: 1 },
  backupModalScrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 12 },
  backupModal: {
    flexShrink: 0,
    backgroundColor: COLORS.white,
    borderRadius: 26,
    overflow: "hidden",
    padding: 22,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.homeBorder,
  },
  backupModalDescription: {
    color: "#5E6C82",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 18,
  },
  backupDisabled: { opacity: 0.6 },

  settingsPrivacyNote: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 22,
    padding: 13,
    backgroundColor: "#F5F8FC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.homeBorder,
  },
  settingsPrivacyIcon: { fontSize: 20 },
  settingsPrivacyText: { flex: 1, color: COLORS.settingsMutedText, fontSize: 11, lineHeight: 16 },
  settingsDoneButton: {
    marginTop: 18,
    borderRadius: 15,
    backgroundColor: COLORS.saffron,
    paddingVertical: 15,
    alignItems: "center",
  },
  settingsDoneText: { color: COLORS.darkText, fontWeight: "900", fontSize: 14 },
  // Web renders as a mobile-sized authenticator shell on desktop.
  webDesktopLayout: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    minWidth: 0,
    backgroundColor: "#E9EEF4",
  },
  // Desktop-only product information panel. Native/mobile styles remain untouched.
  desktopInfoScroll: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F4F7F5",
  },
  desktopInfoContent: {
    paddingHorizontal: 34,
    paddingTop: 30,
    paddingBottom: 32,
    width: "100%",
    flexGrow: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  desktopInfoInner: {
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
  },
  desktopBannerFrame: {
    width: "100%",
    minHeight: 150,
    marginBottom: 22,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DCE7DF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  desktopBrandBanner: {
    width: "100%",
    height: 190,
  },
  desktopInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#E8F0EA",
  },
  desktopLogoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#13834B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  desktopLogoMarkText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  desktopOfficialLogo: {
    width: 138,
    height: 48,
    marginRight: 12,
  },
  desktopBrandName: {
    color: "#142B23",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginRight: 12,
  },
  desktopBrandTag: {
    color: "#244B36",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  desktopHero: {
    alignItems: "flex-start",
    marginBottom: 26,
    paddingHorizontal: 28,
    paddingVertical: 28,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#164C35",
    backgroundColor: "#123B2B",
    overflow: "hidden",
  },
  desktopEyebrow: {
    color: "#FFD28A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 13,
  },
  desktopHeroTitle: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "900",
    letterSpacing: -0.9,
  },
  desktopHeroDescription: {
    color: "#E0EEE5",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 720,
    textAlign: "left",
  },
  desktopHeroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  desktopHeroPill: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#47745D",
    backgroundColor: "#1D5039",
  },
  desktopFeatureHeading: {
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 3,
  },
  desktopSectionEyebrow: {
    color: "#287047",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 7,
    textAlign: "left",
  },
  desktopSectionTitle: {
    color: "#172D22",
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "left",
  },
  desktopFeatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  desktopFeatureCard: {
    width: "48%",
    minWidth: 220,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6DF",
    borderRadius: 18,
    padding: 19,
    shadowColor: "#173B2A",
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  desktopFeatureNumber: {
    color: "#168047",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  desktopFeatureTitle: {
    color: "#152D21",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  desktopFeatureDescription: {
    color: "#45594D",
    fontSize: 13,
    lineHeight: 20,
  },
  desktopPrivacyNote: {
    backgroundColor: "#E3F0E7",
    borderWidth: 1,
    borderColor: "#C9E0D0",
    borderRadius: 20,
    padding: 21,
    marginTop: 20,
  },
  desktopPrivacyTitle: {
    color: "#164B30",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  desktopPrivacyDescription: {
    color: "#365D46",
    fontSize: 12,
    lineHeight: 19,
  },
  desktopInfoFooter: {
    color: "#6F8376",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 24,
    textAlign: "center",
  },

  // Slim visible divider, with a wider 14px drag target.
  webDesktopSplitter: {
    width: 14,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 14,
    backgroundColor: "transparent",
    cursor: "col-resize" as any,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  webDesktopSplitterGrip: {
    width: 5,
    height: 48,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  webDesktopSplitterGripLine: {
    width: 1,
    height: 4,
    borderRadius: 1,
    backgroundColor: "#F8FAFC",
  },
  webBrandPanel: {
    flex: 1,
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#E9EEF4",
  },
  webBrandPanelContent: { flex: 1, minWidth: 320, minHeight: "100%" },
  webBrandImage: {
    width: "100%",
    maxWidth: 680,
    height: "78%",
  },
  webMobileLayout: {
    flex: 1,
    width: "100%",
    alignItems: "stretch",
    backgroundColor: "#E9EEF4",
  },
  webMobileRoot: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    alignItems: "stretch",
    backgroundColor: "#E9EEF4",
  },
  webRoot: {
    flexGrow: 0,
    flexShrink: 0,
    width: "27%",
    minWidth: 400,
    alignItems: "flex-start",
    backgroundColor: "#E9EEF4",
  },
  webAppShell: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    backgroundColor: COLORS.homeSoftSurface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D8E0EA",
    overflow: "hidden",
  },
  nativeAppShell: {
    flex: 1,
    width: "100%",
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.homeSoftSurface,
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
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceLight,
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
    color: COLORS.indiaGreen,
  },
  lockScreen: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: COLORS.homeSoftSurface,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  lockCard: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.homeCardBorder,
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
    color: COLORS.textPrimary,
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 10,
  },
  lockTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  lockDescription: {
    color: COLORS.homeSecondaryText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  unlockButton: {
    width: "100%",
    backgroundColor: COLORS.saffron,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  unlockButtonText: {
    color: COLORS.darkText,
    fontSize: 13,
    fontWeight: "900",
  },
  lockFootnote: {
    color: COLORS.placeholder,
    fontSize: 10,
    marginTop: 18,
    textAlign: "center",
  },

  header: {
    paddingTop: 8,
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.saffron,
  },

  brandK: {
    color: COLORS.linkBlue,
  },

  brandEy: {
    color: COLORS.successGreen,
  },

  brandSubtitle: {
    marginTop: 1,
    marginBottom: 7,
    color: COLORS.secondaryText,
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
    backgroundColor: COLORS.indiaGreen,
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
    color: COLORS.saffron,
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
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },

  searchInput: {
    flex: 1,
    minHeight: 44,
    color: COLORS.textPrimary,
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
    color: COLORS.amberDark,
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
    color: COLORS.homeMutedText,
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
    backgroundColor: COLORS.white,
  },

  sortButtonActive: {
    borderColor: COLORS.saffron,
    backgroundColor: COLORS.saffronSurface,
  },

  sortButtonText: {
    color: COLORS.settingsMutedText,
    fontSize: 11,
    fontWeight: "700",
  },

  sortButtonTextActive: {
    color: COLORS.amberDark,
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
    borderColor: COLORS.saffron,
    backgroundColor: COLORS.saffronSurface,
  },

  editButtonText: {
    color: COLORS.amberDark,
    fontSize: 11,
    fontWeight: "700",
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  accountCount: {
    color: COLORS.homeMutedText,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  addButton: {
    backgroundColor: COLORS.saffron,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 13,
    shadowColor: COLORS.saffronShadow,
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  addButtonText: {
    color: COLORS.darkText,
    fontSize: 13,
    fontWeight: "800",
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: COLORS.homeCardBorder,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.saffronLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyIconText: {
    color: COLORS.saffron,
    fontSize: 30,
  },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 9,
  },

  emptyText: {
    color: COLORS.homeSecondaryText,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: COLORS.saffron,
    borderRadius: 14,
    minHeight: 51,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 21,
    shadowColor: COLORS.saffronShadow,
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  primaryButtonText: {
    color: COLORS.darkText,
    fontSize: 14,
    fontWeight: "800",
  },

  accountCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
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
    backgroundColor: COLORS.saffronLight,
    borderWidth: 1,
    borderColor: "#F5D4AD",
    alignItems: "center",
    justifyContent: "center",
  },

  accountIconText: {
    color: COLORS.saffronTextDark,
    fontSize: 20,
    fontWeight: "900",
  },

  accountInfo: {
    flex: 1,
  },

  accountIssuer: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },

  accountName: {
    color: COLORS.mutedText,
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
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  code: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 3,
    fontVariant: ["tabular-nums"],
  },

  copyHint: {
    color: COLORS.saffronTextDark,
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
    borderTopColor: COLORS.borderSoft,
  },

  footerBrand: {
    color: COLORS.slateText,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  footerText: {
    color: COLORS.homePlaceholderText,
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
    paddingVertical: 12,
  },

  modalCard: {
    flexShrink: 1,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    overflow: "hidden",
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
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
    backgroundColor: COLORS.homeSubtleSurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },

  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: COLORS.mutedText,
    fontSize: 12,
    marginTop: 7,
  },

  closeButton: {
    color: COLORS.slateDark,
    fontSize: 27,
    lineHeight: 30,
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
  },

  inputLabel: {
    color: COLORS.slateText,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 9,
    marginTop: 15,
  },

  input: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 11,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },

  inputClearWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  inputWithClearSpace: {
    paddingRight: 48,
  },

  clearInputButton: {
    position: "absolute",
    right: 4,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  clearInputButtonText: {
    color: COLORS.amberDark,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },

  optionChip: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceLight,
  },

  optionChipSelected: {
    borderColor: COLORS.saffron,
    backgroundColor: COLORS.saffronLight,
  },

  optionChipText: {
    color: COLORS.slateText,
    fontSize: 12,
    fontWeight: "700",
  },

  optionChipTextSelected: {
    color: COLORS.amberDark,
  },

  securityNote: {
    color: COLORS.mutedText,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 15,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.saffronSurface,
    borderColor: COLORS.saffron,
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    marginBottom: 19,
    gap: 12,
  },

  importQrButton: {
    backgroundColor: "#F1F6FF",
    borderColor: "#B8CBE5",
    marginTop: -8,
  },

  scanButtonIcon: {
    color: COLORS.saffron,
    fontSize: 28,
    fontWeight: "800",
  },

  scanButtonCopy: {
    flex: 1,
  },

  scanButtonTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },

  scanButtonSubtitle: {
    color: COLORS.mutedText,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  scanButtonArrow: {
    color: COLORS.saffron,
    fontSize: 28,
  },

  manualEntryLabel: {
    color: COLORS.homePlaceholderText,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 2,
    marginBottom: 3,
  },

  scannerContainer: {
    flex: 1,
    backgroundColor: "#080D18",
  },

  scannerScrollContent: {
    flexGrow: 1,
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
    color: COLORS.saffron,
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 8,
  },

  scannerStep: {
    color: COLORS.placeholder,
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
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#314451",
    backgroundColor: COLORS.homeDarkSurface,
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
    backgroundColor: COLORS.homeDarkSurface,
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
    borderColor: COLORS.saffron,
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
    borderColor: COLORS.saffron,
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
    borderColor: COLORS.saffron,
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
    borderColor: COLORS.saffron,
    borderBottomRightRadius: 9,
  },

  scannerHint: {
    color: COLORS.placeholder,
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
    color: COLORS.saffron,
    fontSize: 13,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.saffron,
    backgroundColor: COLORS.saffronSurface,
  },

  cancelButtonText: {
    color: COLORS.amberDark,
    fontSize: 13,
    fontWeight: "700",
  },

  scannerTorchButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  scannerTorchText: { color: "#FFFFFF", fontWeight: "700" },

  backupPasswordCard: {
    backgroundColor: "#F5F8FC",
    borderWidth: 1,
    borderColor: "#DCE5F0",
    borderRadius: 12,
    padding: 12,
  },
  backupPasswordText: {
    color: "#17243A",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  backupCopyButton: { marginTop: 10, borderColor: "#16834A" },
  backupCopyButtonText: { color: "#16834A", fontWeight: "800" },
  webAppPanel: { flex: 1, minWidth: 320, minHeight: "100%" },
});

export function getWebRootPanelStyle(width: number): ViewStyle {
  return { width, minWidth: 400, flexGrow: 0, flexShrink: 0, flexBasis: width };
}
