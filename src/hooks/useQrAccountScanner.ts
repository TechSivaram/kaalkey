import { useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as OTPAuth from "otpauth";
import type { Account } from "../types/account";
import { validateAccount } from "../services/account-validation";
import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_ALGORITHMS,
  SUPPORTED_TOTP_DIGITS,
  TOTP_URI_PREFIX,
} from "../constants/totp";

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
    const qrPayload = data
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim()
      .replace(/^otpauth:\/\/totp\//i, TOTP_URI_PREFIX);

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
      if (!qrPayload.toLowerCase().startsWith(TOTP_URI_PREFIX)) {
        showMessage(
          "Unsupported QR code",
          "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.",
        );
        if (fromCamera) {
          qrProcessingRef.current = false;
          setScanned(false);
          setScannerDiagnostic("That QR is not a TOTP setup code. Aim at an authenticator setup QR.");
        }
        return;
      }

      const parsedUri = OTPAuth.URI.parse(qrPayload);
      if (!(parsedUri instanceof OTPAuth.TOTP)) {
        throw new Error("This QR code is not a time-based authenticator setup code.");
      }
      const parsed = parsedUri;
      const normalizedName = parsed.label?.trim();
      const normalizedIssuer = parsed.issuer?.trim() || "Authenticator";
      const normalizedSecret = parsed.secret.base32;
      const algorithm = parsed.algorithm;

      if (!normalizedName || !normalizedSecret) {
        throw new Error("The QR code is missing account details.");
      }
      if (!SUPPORTED_TOTP_ALGORITHMS.includes(algorithm as (typeof SUPPORTED_TOTP_ALGORITHMS)[number])) {
        throw new Error("The QR code uses an unsupported algorithm.");
      }
      if (!Number.isInteger(parsed.digits) || !SUPPORTED_TOTP_DIGITS.includes(parsed.digits as (typeof SUPPORTED_TOTP_DIGITS)[number])) {
        throw new Error("This QR code must use 6, 7, or 8 digits.");
      }
      if (!Number.isInteger(parsed.period) || parsed.period < MIN_TOTP_PERIOD_SECONDS || parsed.period > MAX_TOTP_PERIOD_SECONDS) {
        throw new Error("This QR code uses an unsupported time period.");
      }

      const account: Account = {
        id: Date.now().toString() + "-" + Math.random().toString(36).slice(2),
        issuer: normalizedIssuer,
        name: normalizedName,
        secret: normalizedSecret,
        algorithm: algorithm as Account["algorithm"],
        digits: parsed.digits,
        period: parsed.period,
      };
      if (!validateAccount(account)) throw new Error("The QR code could not be validated.");

      const duplicate = accounts.some(
        (existing) =>
          existing.issuer.toLowerCase() === account.issuer.toLowerCase() &&
          existing.name.toLowerCase() === account.name.toLowerCase(),
      );
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
    const payload = value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!payload.toLowerCase().startsWith(TOTP_URI_PREFIX)) {
      showMessage(
        "Invalid TOTP URL",
        `Paste a complete authenticator URL beginning with ${TOTP_URI_PREFIX}.`,
      );
      return;
    }
    await handleQrScanned(payload, false);
  }

  async function pasteTotpUrl(setTotpUrlInput: (value: string) => void, value: string) {
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
