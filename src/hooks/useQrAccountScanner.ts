import { isWeb } from "../platform/runtime";
import { useCallback, useMemo, useRef, useState } from "react";
import { useAppLanguage } from "../i18n";
import { Alert } from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import type { Account } from "../types/account";
import { parseTotpAccountFromUri } from "../services/totp-account-import";
import { hasDuplicateAccount } from "../services/account-duplicates";
import { TOTP_URI_PREFIX } from "../constants/totp";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../utils/totpQrPayload";
import { createUserMessages } from "../constants/userMessages";

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
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const [scanned, setScanned] = useState(false);
  const [scannerDiagnostic, setScannerDiagnostic] = useState("Point your camera at the QR code.");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const qrProcessingRef = useRef(false);
  const cameraViewRef = useRef<any>(null);

  const openQrScanner = useCallback(async () => {
    if (isWeb) {
      setScanned(false);
      qrProcessingRef.current = false;
      setModalVisible(false);
      setScannerVisible(true);
      return;
    }

    // Use the same visible live preview on native platforms in Expo Go and standalone builds.
    // The native Google Code Scanner opens a separate UI and is not our primary path.
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        setModalVisible(true);
        Alert.alert(USER_MESSAGES.cameraPermission.title, USER_MESSAGES.cameraPermission.body);
        return;
      }
    }

    qrProcessingRef.current = false;
    setScannerDiagnostic(USER_MESSAGES.qr.startingCamera);
    setScanned(false);
    setModalVisible(false);
    setScannerVisible(true);
  }, [
    cameraPermission,
    requestCameraPermission,
    setModalVisible,
    setScannerVisible,
    setScannerDiagnostic,
    USER_MESSAGES,
  ]);

  const handleQrScanned = useCallback(
    async (data: string, fromCamera = true) => {
      // Image decoders can include surrounding whitespace or invisible Unicode
      // characters. Normalize only the outer payload/protocol; preserve encoded values.
      const qrPayload = normalizeTotpQrPayload(data);

      // `scanned` debounces repeated live-camera frames. Image imports remain available.
      if (fromCamera) {
        if (qrProcessingRef.current || scanned) return;
        qrProcessingRef.current = true;
        setScanned(true);
        setScannerDiagnostic(USER_MESSAGES.qr.detectedDiagnostic);
      }
      setActivityMessage(USER_MESSAGES.qr.analyzing);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      try {
        if (!isTotpQrPayload(qrPayload)) {
          showMessage(USER_MESSAGES.qr.unsupportedTitle, USER_MESSAGES.qr.unsupportedBody);
          if (fromCamera) {
            qrProcessingRef.current = false;
            setScanned(false);
            setScannerDiagnostic(USER_MESSAGES.qr.unsupportedDiagnostic);
          }
          return;
        }

        const account = parseTotpAccountFromUri(qrPayload, t);

        const duplicate = hasDuplicateAccount(accounts, account.issuer, account.name);
        if (duplicate) {
          setScannerVisible(false);
          showMessage(
            USER_MESSAGES.qr.duplicateTitle,
            USER_MESSAGES.qr.duplicateBody(account.issuer, account.name),
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
          showMessage(
            USER_MESSAGES.qr.addedTitle,
            USER_MESSAGES.qr.addedBody(account.issuer, account.name),
          );
        } else if (fromCamera) {
          qrProcessingRef.current = false;
          setScanned(false);
          setScannerDiagnostic(USER_MESSAGES.qr.saveFailedDiagnostic);
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown QR parsing error";
        showMessage(
          USER_MESSAGES.qr.invalidTitle,
          USER_MESSAGES.qr.invalidBody(detail, TOTP_URI_PREFIX),
        );
        if (fromCamera) {
          qrProcessingRef.current = false;
          setScanned(false);
          setScannerDiagnostic(USER_MESSAGES.qr.parseFailedDiagnostic);
        }
      } finally {
        setActivityMessage(null);
      }
    },
    [
      scanned,
      USER_MESSAGES,
      setActivityMessage,
      showMessage,
      t,
      accounts,
      setScannerVisible,
      saveAccounts,
      hapticFeedback,
      setModalVisible,
      setEditingId,
    ],
  );

  const importTotpUrl = useCallback(
    async (value: string) => {
      const payload = normalizeTotpQrPayload(value);
      if (!isTotpQrPayload(payload)) {
        showMessage(
          USER_MESSAGES.qr.invalidUrlTitle,
          USER_MESSAGES.qr.invalidUrlBody(TOTP_URI_PREFIX),
        );
        return;
      }
      await handleQrScanned(payload, false);
    },
    [USER_MESSAGES, showMessage, handleQrScanned],
  );

  const pasteTotpUrl = useCallback(
    async (setTotpUrlInput: (value: string) => void) => {
      try {
        const pasted = (await Clipboard.getStringAsync()).trim();
        if (!pasted) {
          showMessage(
            USER_MESSAGES.qr.clipboardEmptyTitle,
            USER_MESSAGES.qr.clipboardEmptyBody(TOTP_URI_PREFIX),
          );
          return;
        }
        setTotpUrlInput(pasted);
        await importTotpUrl(pasted);
      } catch {
        showMessage(USER_MESSAGES.qr.clipboardErrorTitle, USER_MESSAGES.qr.clipboardErrorBody);
      }
    },
    [USER_MESSAGES, showMessage, importTotpUrl],
  );

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
