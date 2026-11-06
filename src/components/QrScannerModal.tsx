import { memo, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { createUserMessages } from "../constants/userMessages";
import { useAppLanguage } from "../i18n";
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
function QrScannerModal({
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
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && windowWidth >= 900;
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
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
          ...(isDesktopWeb ? [styles.webScannerContent] : []),
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.scannerHeader, ...(isDesktopWeb ? [styles.webScannerHeader] : [])]}>
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

        <View style={[styles.scannerIntro, ...(isDesktopWeb ? [styles.webScannerIntro] : [])]}>
          <Text style={styles.scannerTitle}>{t("addAccount.scanQrCode2")}</Text>
          <Text style={styles.scannerSubtitle}>{t("qrScanner.pointCameraAuthenticator")}</Text>
        </View>

        <View style={isDesktopWeb ? styles.webScannerBody : undefined}>
          <View style={isDesktopWeb ? styles.webScannerCameraColumn : undefined}>
            <View
              style={[
                styles.cameraFrame,
                getQrScannerCameraFrameStyle(scannerCameraHeight),
                ...(isDesktopWeb ? [styles.webCameraFrame] : []),
              ]}
            >
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
          </View>

          <View style={isDesktopWeb ? styles.webScannerManualPanel : undefined}>
            <TouchableOpacity
              style={[
                styles.scannerManualButton,
                ...(isDesktopWeb ? [styles.webScannerManualButton] : []),
              ]}
              onPress={() => {
                closeScanner();
              }}
            >
              <Text style={styles.scannerManualText}>{t("qrScanner.enterDetailsManually")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

export default memo(QrScannerModal);
