import { Platform, StyleSheet } from "react-native";
import type { CSSProperties } from "react";
import { COLORS } from "../constants/colors";

export const accountQrModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 20, 38, 0.72)",
    justifyContent: "center",
    padding: 22,
  },
  card: { backgroundColor: COLORS.white, borderRadius: 22, padding: 22, alignItems: "center" },
  title: { color: COLORS.navy, fontSize: 21, fontWeight: "800", marginBottom: 8 },
  accountLabel: {
    color: "#53637A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  warning: {
    color: "#8A3B18",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 18,
  },
  fullWidth: { width: "100%" },
  privacyHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 12,
  },
  closeButton: { width: "100%", marginTop: 10 },
});

export const homeHeaderAccentStyles = StyleSheet.create({
  saffron: { backgroundColor: COLORS.saffron },
  white: { backgroundColor: COLORS.white },
  green: { backgroundColor: COLORS.indiaGreen },
});

export const legalDocumentContentStyles = StyleSheet.create({
  privacyTitle: { fontSize: 19, fontWeight: "800", color: COLORS.navy, marginBottom: 5 },
  privacySubtitle: { fontSize: 12, color: COLORS.legalMutedText, marginBottom: 14 },
  termsTitle: { fontSize: 19, fontWeight: "800", color: COLORS.navy, marginBottom: 5 },
  termsSubtitle: { fontSize: 12, color: COLORS.legalMutedText, marginBottom: 14 },
  heading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 13,
    marginBottom: 4,
  },
  body: { fontSize: 13, lineHeight: 20, color: "#45556D" },
});

export const legalDocumentScrollPanelStyles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E6EF",
  },
  content: { padding: 16, paddingBottom: 24 },
});

export const legalNoticeScreenStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
});

export const qrScannerModalStyles = StyleSheet.create({
  cameraFrame: { flex: 1 },
});
export const getQrScannerCameraFrameStyle = (height: number) => ({ height });

export const settingsBackupActivityStyles = StyleSheet.create({
  settingsContent: { paddingHorizontal: 16 },
  settingRowOffset: { marginTop: 8 },
  legalChevron: { color: "#60718A", fontSize: 20 },
  backupContent: { paddingHorizontal: 12 },
});

export const webQrScannerStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.webScannerBackground,
    overflow: "hidden",
  },
  message: { color: "white", fontSize: 12, padding: 8, textAlign: "center" },
});
export const webQrVideoStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: 240,
  objectFit: "contain",
  backgroundColor: COLORS.webScannerBackground,
};

export const getActivityOverlayStyles = (insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      zIndex: 2147483647,
      elevation: 2147483647,
      backgroundColor: "rgba(8, 18, 32, 0.42)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      ...(Platform.OS === "android"
        ? {
            paddingTop: Math.max(insets.top + 24, 36),
            paddingBottom: Math.max(insets.bottom + 24, 36),
          }
        : {}),
    },
    card: {
      minWidth: 190,
      maxWidth: 300,
      paddingVertical: 24,
      paddingHorizontal: 28,
      borderRadius: 18,
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.7)",
    },
    message: {
      color: COLORS.navy,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 14,
      textAlign: "center",
    },
    hint: { color: "#64748B", fontSize: 12, marginTop: 6, textAlign: "center" },
  });

export const getLegalDocumentTabStyles = (document: "privacy" | "terms") =>
  StyleSheet.create({
    tabs: { flexDirection: "row", gap: 8, marginBottom: 10 },
    privacyTab: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: document === "privacy" ? COLORS.legalNavy : COLORS.legalTabInactiveSurface,
      alignItems: "center",
    },
    privacyText: {
      color: document === "privacy" ? COLORS.white : COLORS.legalTabInactiveText,
      fontWeight: "700",
    },
    termsTab: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: document === "terms" ? COLORS.legalNavy : COLORS.legalTabInactiveSurface,
      alignItems: "center",
    },
    termsText: {
      color: document === "terms" ? COLORS.white : COLORS.legalTabInactiveText,
      fontWeight: "700",
    },
  });

export const getLegalNoticeFooterStyles = (checked: boolean) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: checked ? COLORS.legalAcceptedGreen : "#8997AA",
      backgroundColor: checked ? COLORS.legalAcceptedGreen : COLORS.white,
      alignItems: "center",
      justifyContent: "center",
    },
    checkmark: { color: COLORS.white, fontWeight: "800" },
    agreement: { flex: 1, color: "#34445D", fontSize: 12, lineHeight: 18 },
    accept: {
      backgroundColor: checked ? COLORS.legalNavy : "#AAB5C4",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginBottom: 4,
    },
    acceptText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
    done: {
      backgroundColor: COLORS.legalNavy,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 12,
    },
    doneText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  });

export const legalNoticeHeaderStyles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 18,
    paddingVertical: 2,
  },
  emblem: { width: 88, height: 80 },
  copy: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
  brand: { fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: 0.1 },
  saffron: { color: COLORS.saffron },
  blue: { color: COLORS.linkBlue },
  green: { color: COLORS.successGreen },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 2.1,
    color: COLORS.secondaryText,
    fontWeight: "800",
    marginTop: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#D6E0EE",
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.successGreen },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.legalSecondaryText,
  },
  title: { fontSize: 23, fontWeight: "800", color: "#14233D", marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 19, color: COLORS.legalSecondaryText, marginBottom: 12 },
});

export const getCountdownDynamicStyles = (pulse: any, numberColor: string) =>
  StyleSheet.create({
    pulse: { transform: [{ scale: pulse }] },
    countdownNumber: { color: numberColor },
  });

export const accountTotpUrlImportStyles = StyleSheet.create({
  fieldGroup: { marginBottom: 12 },
  urlInputRow: { flexDirection: "row", alignItems: "center", position: "relative" },
  urlInput: { flex: 1, paddingRight: 54 },
  inlineImportButton: {
    position: "absolute",
    right: 6,
    top: 6,
    bottom: 6,
    width: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF2DF",
    borderWidth: 1,
    borderColor: "#FFD39A",
  },
  inlineImportIcon: { color: "#E88700", fontSize: 24, fontWeight: "800" },
});
export const getAccountQrOverlayStyles = (insets: { top: number; bottom: number }) => [
  accountQrModalStyles.overlay,
  Platform.OS === "android"
    ? { paddingTop: Math.max(insets.top + 22, 34), paddingBottom: Math.max(insets.bottom + 22, 34) }
    : null,
];
export const getAccountEditorBackdropStyles = (insets: { top: number; bottom: number }) => [
  Platform.OS === "android"
    ? { paddingTop: Math.max(insets.top + 16, 32), paddingBottom: Math.max(insets.bottom + 16, 32) }
    : null,
];
export const getSettingsBackdropStyles = (
  insets: { top: number; bottom: number },
  backup = false,
) => [
  backup
    ? settingsBackupActivityStyles.backupContent
    : settingsBackupActivityStyles.settingsContent,
  Platform.OS === "android"
    ? { paddingTop: Math.max(insets.top + 12, 28), paddingBottom: Math.max(insets.bottom + 12, 28) }
    : null,
];
export const getQrScannerScrollContentStyle = (insets: { top: number; bottom: number }) => [
  { paddingTop: Math.max(insets.top + 12, 24), paddingBottom: Math.max(insets.bottom + 24, 36) },
];
export const getCountdownSegmentStyle = (
  index: number,
  progress: number,
  countdownColor: string,
) => {
  const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
  const radius = 23;
  const segmentProgress = Math.max(0, Math.min(1, progress * 24 - index));
  return {
    left: 27 + Math.cos(angle) * radius - 2,
    top: 27 + Math.sin(angle) * radius - 2,
    backgroundColor: segmentProgress > 0 ? countdownColor : "#CBD3DE",
    opacity: segmentProgress > 0 ? 0.35 + segmentProgress * 0.65 : 0.58,
    transform: [{ scale: segmentProgress > 0 ? 0.82 + segmentProgress * 0.18 : 0.82 }],
  };
};
