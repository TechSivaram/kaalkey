import { isAndroid, isWeb } from "../platform/runtime";
import { memo, useCallback, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { createUserMessages } from "../constants/userMessages";
import { useAppLanguage } from "../i18n";
import { styles } from "../styles/home.styles";
import ScannerCamera from "../platform/scanner/scanner";
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
  const isDesktopWeb = isWeb && windowWidth >= 900;
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [cameraDevices, setCameraDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState<string | null>(null);
  const [cameraPickerVisible, setCameraPickerVisible] = useState(false);
  const handleCameraDevicesChange = useCallback(
    (devices: { deviceId: string; label: string }[], activeDeviceId?: string | null) => {
      setCameraDevices(devices);
      if (activeDeviceId) setSelectedCameraDeviceId(activeDeviceId);
    },
    [],
  );

  // Reset torch when scanner closes so it never remains on after leaving.
  const closeScanner = () => {
    setTorchEnabled(false);
    setCameraFacing("back");
    setSelectedCameraDeviceId(null);
    setCameraPickerVisible(false);
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
            {isWeb && cameraDevices.length > 1 ? (
              <View style={{ width: "100%", alignItems: "flex-end", marginBottom: 8, zIndex: 5 }}>
                <View style={{ alignItems: "flex-end" }}>
                  <TouchableOpacity
                    onPress={() => setCameraPickerVisible((visible) => !visible)}
                    accessibilityRole="button"
                    accessibilityLabel="Choose camera"
                    style={{
                      backgroundColor: "#171717",
                      borderWidth: 1,
                      borderColor: "#344054",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      maxWidth: 280,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}
                    >
                      {cameraDevices.find((device) => device.deviceId === selectedCameraDeviceId)
                        ?.label || "Select camera"}{" "}
                      ▾
                    </Text>
                  </TouchableOpacity>
                  {cameraPickerVisible ? (
                    <View
                      style={{
                        marginTop: 5,
                        minWidth: 180,
                        maxWidth: 280,
                        backgroundColor: "#171717",
                        borderWidth: 1,
                        borderColor: "#344054",
                        borderRadius: 8,
                        padding: 5,
                      }}
                    >
                      {cameraDevices.map((device, index) => (
                        <TouchableOpacity
                          key={device.deviceId}
                          onPress={() => {
                            setSelectedCameraDeviceId(device.deviceId);
                            setCameraPickerVisible(false);
                          }}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 10,
                            borderRadius: 5,
                            backgroundColor:
                              device.deviceId === selectedCameraDeviceId
                                ? "#454545"
                                : "transparent",
                          }}
                        >
                          <Text numberOfLines={2} style={{ color: "#FFFFFF", fontSize: 12 }}>
                            {device.label || `Camera ${index + 1}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
            <View
              style={[
                styles.cameraFrame,
                getQrScannerCameraFrameStyle(scannerCameraHeight),
                ...(isDesktopWeb ? [styles.webCameraFrame] : []),
              ]}
            >
              {scannerVisible && (isWeb || cameraPermission?.granted) ? (
                <ScannerCamera
                  active={scannerVisible && !scanned}
                  onDetected={(data) => void handleQrScanned(data)}
                  cameraRef={cameraViewRef}
                  style={styles.cameraPreview}
                  enableTorch={torchEnabled}
                  facing={cameraFacing}
                  selectedCameraDeviceId={isWeb ? selectedCameraDeviceId : undefined}
                  onCameraDevicesChange={isWeb ? handleCameraDevicesChange : undefined}
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
              <TouchableOpacity
                onPress={() => {
                  setTorchEnabled(false);
                  if (isWeb && cameraDevices.length > 1) {
                    const currentIndex = cameraDevices.findIndex(
                      (device) => device.deviceId === selectedCameraDeviceId,
                    );
                    const next =
                      cameraDevices[
                        (currentIndex + 1 + cameraDevices.length) % cameraDevices.length
                      ];
                    setSelectedCameraDeviceId(next.deviceId);
                  } else {
                    setCameraFacing((current) => (current === "back" ? "front" : "back"));
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch camera"
                style={styles.scannerSwitchCameraButton}
              >
                <Text style={styles.scannerTorchText}>↻</Text>
              </TouchableOpacity>
              {!isWeb && cameraPermission?.granted ? (
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
            {(isAndroid || isWeb) && scannerDiagnostic ? (
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
