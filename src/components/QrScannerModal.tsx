import { useAppLanguage } from "../i18n";
import { useState } from "react";
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { USER_MESSAGES } from "../constants/userMessages";
import { styles } from "../styles/home.styles";
import WebQrScanner from "./WebQrScanner";
import NativeQrCamera from "./qr-scanner/NativeQrCamera";
import {
  getQrScannerCameraFrameStyle,
  getQrScannerScrollContentStyle,
} from "../styles/component.styles";

type Props = {
  scannerVisible: boolean;
  setScannerVisible: (value: boolean) => void;
  setModalVisible: (value: boolean) => void;
  qrProcessingRef: { current: boolean };
  insets: { top: number; bottom: number };
  scannerCameraHeight: number;
  scanned: boolean;
  scannerDiagnostic: string;
  setScannerDiagnostic: (value: string) => void;
  cameraPermission: { granted: boolean } | null;
  cameraViewRef: { current: any };
  handleQrScanned: (data: string, fromCamera?: boolean) => Promise<void>;
};

/** Live QR scanner dialog, separated from the main vault screen. */
export default function QrScannerModal({
  scannerVisible,
  setScannerVisible,
  setModalVisible,
  qrProcessingRef,
  insets,
  scannerCameraHeight,
  scanned,
  scannerDiagnostic,
  setScannerDiagnostic,
  cameraPermission,
  cameraViewRef,
  handleQrScanned,
}: Props) {
  const { t } = useAppLanguage();
  const [torchEnabled, setTorchEnabled] = useState(false);

  // Reset torch when scanner closes so it never remains on after leaving.
  const closeScanner = () => {
    setTorchEnabled(false);
    setScannerVisible(false);
    qrProcessingRef.current = false;
    setModalVisible(true);
  };

  return (
    <Modal
      visible={scannerVisible}
      animationType="slide"
      onRequestClose={() => {
        closeScanner();
      }}
    >
      <ScrollView
        style={styles.scannerContainer}
        contentContainerStyle={[
          styles.scannerScrollContent,
          ...getQrScannerScrollContentStyle(insets),
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            onPress={() => {
              setScannerVisible(false);
              qrProcessingRef.current = false;
              setModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={t("qrScanner.backAddAccount")}
          >
            <Text style={styles.scannerBack}>‹ {t("qrScanner.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.scannerStep}>{t("qrScanner.secureSetup")}</Text>
        </View>

        <View style={styles.scannerIntro}>
          <Text style={styles.scannerTitle}>{t("addAccount.scanQrCode2")}</Text>
          <Text style={styles.scannerSubtitle}>{t("qrScanner.pointCameraAuthenticator")}</Text>
        </View>

        <View style={[styles.cameraFrame, getQrScannerCameraFrameStyle(scannerCameraHeight)]}>
          {scannerVisible && Platform.OS === "web" ? (
            <WebQrScanner
              active={scannerVisible && !scanned}
              onDetected={(data) => void handleQrScanned(data)}
            />
          ) : scannerVisible && cameraPermission?.granted ? (
            <NativeQrCamera
              cameraRef={cameraViewRef}
              style={styles.cameraPreview}
              enableTorch={torchEnabled}
              onCameraReady={() => {
                setScannerDiagnostic(USER_MESSAGES.activity.cameraReady);
              }}
              onMountError={(event) => {
                setScannerDiagnostic(`Camera could not start: ${event.message}`);
              }}
              onBarcodeScanned={scanned ? undefined : ({ data }) => void handleQrScanned(data)}
            />
          ) : (
            <View style={styles.cameraUnavailable}>
              <Text style={styles.cameraUnavailableText}>
                {t("qrScanner.cameraUnavailableCheck")}
              </Text>
            </View>
          )}
          <View pointerEvents="none" style={styles.scanCornerTL} />
          <View pointerEvents="none" style={styles.scanCornerTR} />
          <View pointerEvents="none" style={styles.scanCornerBL} />
          <View pointerEvents="none" style={styles.scanCornerBR} />
          {Platform.OS !== "web" && cameraPermission?.granted ? (
            <TouchableOpacity
              onPress={() => setTorchEnabled((enabled) => !enabled)}
              accessibilityRole="button"
              accessibilityLabel={
                torchEnabled ? t("qrScanner.turnFlashlightOff") : t("qrScanner.turnFlashlight")
              }
              style={styles.scannerTorchButton}
            >
              <Text style={styles.scannerTorchText}>
                {torchEnabled
                  ? `☀ ${t("qrScanner.flashlight")}`
                  : `☼ ${t("qrScanner.flashlight2")}`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.scannerHint}>{t("qrScanner.keepEntireQr")}</Text>
        {Platform.OS === "android" ? (
          <Text accessibilityLiveRegion="polite" style={styles.scannerHint}>
            {scannerDiagnostic}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.scannerManualButton}
          onPress={() => {
            closeScanner();
          }}
        >
          <Text style={styles.scannerManualText}>{t("qrScanner.enterDetailsManually")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}
