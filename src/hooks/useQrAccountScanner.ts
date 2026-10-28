import { useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import type { Account } from "../types/account";
import { parseTotpAccountFromUri } from "../services/totp-account-import";
import { hasDuplicateAccount } from "../services/account-duplicates";
import { TOTP_URI_PREFIX } from "../constants/totp";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../utils/totpQrPayload";

type UseQrAccountScannerOptions = {
  accounts: Account[];
  saveAccounts: (updated: Account[]) => Promise<boolean>;
  setEditingId: (id: string | null) => void;
  setModalVisible: (visible: boolean) => void;
  setScannerVisible: (visible: boolean) => void;
  setActivityMessage: (message: string | null) => void;
  showMessage: (title: string, message: string) => void;
  hapticFeedback: (kind?: "selection" | "success" | "warning") => void;
};

export function useQrAccountScanner({
  accounts,
  saveAccounts,
  setEditingId,
  setModalVisible,
  setScannerVisible,
  setActivityMessage,
  showMessage,
  hapticFeedback,
}: UseQrAccountScannerOptions) {
  const [scanned, setScanned] = useState(false);
  const [scannerDiagnostic, setScannerDiagnostic] = useState("Point your camera at the QR code.");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const qrProcessingRef = useRef(false);
  const cameraViewRef = useRef<any>(null);

  async function openQrScanner() {
    if (Platform.OS === "web") {
      setScanned(false);
      qrProcessingRef.current = false;
      setModalVisible(false);
      setScannerVisible(true);
      return;
    }

    // Use the same visible live preview on Android in Expo Go and standalone builds.
    // The native Google Code Scanner opens a separate UI and is not our primary path.
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        setModalVisible(true);
        Alert.alert(
          "Camera permission required",
          "Allow camera access to scan an authenticator setup QR code.",
        );
        return;
      }
    }

    qrProcessingRef.current = false;
    setScannerDiagnostic("Starting camera…");
    setScanned(false);
    setModalVisible(false);
    setScannerVisible(true);
  }

  async function handleQrScanned(data: string, fromCamera = true) {
    // Image decoders can include surrounding whitespace or invisible Unicode
    // characters. Normalize only the outer payload/protocol; preserve encoded values.
    const qrPayload = normalizeTotpQrPayload(data);

    // `scanned` debounces repeated live-camera frames. Image imports remain available.
    if (fromCamera) {
      if (qrProcessingRef.current || scanned) return;
      qrProcessingRef.current = true;
      setScanned(true);
      setScannerDiagnostic("QR detected. Analyzing…");
    }
    setActivityMessage("Analyzing QR code…");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    try {
      if (!isTotpQrPayload(qrPayload)) {
        showMessage(
          "Unsupported QR code",
          "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.",
        );
        if (fromCamera) {
          qrProcessingRef.current = false;
          setScanned(false);
          setScannerDiagnostic(
            "That QR is not a TOTP setup code. Aim at an authenticator setup QR.",
          );
        }
        return;
      }

      const account = parseTotpAccountFromUri(qrPayload);

      const duplicate = hasDuplicateAccount(accounts, account.issuer, account.name);
      if (duplicate) {
        setScannerVisible(false);
        showMessage(
          "Account already added",
          `${account.issuer}: ${account.name} is already in KaalKey.`,
        );
        return;
      }

      const saved = await saveAccounts([...accounts, account]);
      if (saved) {
        hapticFeedback("success");
        setScannerVisible(false);
        setModalVisible(false);
        setEditingId(null);
        qrProcessingRef.current = false;
        showMessage("Account added", `${account.issuer}: ${account.name} was added successfully.`);
      } else if (fromCamera) {
        qrProcessingRef.current = false;
        setScanned(false);
        setScannerDiagnostic("Could not save the account. You can scan again.");
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown QR parsing error";
      showMessage(
        "Invalid QR code",
        `KaalKey could not parse this authenticator QR code. ${detail}. Use the service's TOTP setup QR code (usually starts with ${TOTP_URI_PREFIX}).`,
      );
      if (fromCamera) {
        qrProcessingRef.current = false;
        setScanned(false);
        setScannerDiagnostic("QR could not be processed. Aim at the setup QR and try again.");
      }
    } finally {
      setActivityMessage(null);
    }
  }

  async function importTotpUrl(value: string) {
    const payload = normalizeTotpQrPayload(value);
    if (!isTotpQrPayload(payload)) {
      showMessage(
        "Invalid TOTP URL",
        `Paste a complete authenticator URL beginning with ${TOTP_URI_PREFIX}.`,
      );
      return;
    }
    await handleQrScanned(payload, false);
  }

  async function pasteTotpUrl(setTotpUrlInput: (value: string) => void) {
    try {
      const pasted = (await Clipboard.getStringAsync()).trim();
      if (!pasted) {
        showMessage(
          "Clipboard is empty",
          `Copy an ${TOTP_URI_PREFIX} URL first, then tap Paste TOTP URL.`,
        );
        return;
      }
      setTotpUrlInput(pasted);
      await importTotpUrl(pasted);
    } catch {
      showMessage("Could not read clipboard", "Copy the TOTP setup URL and try again.");
    }
  }

  return {
    scanned,
    scannerDiagnostic,
    setScannerDiagnostic,
    cameraPermission,
    qrProcessingRef,
    cameraViewRef,
    openQrScanner,
    handleQrScanned,
    importTotpUrl,
    pasteTotpUrl,
  };
}
