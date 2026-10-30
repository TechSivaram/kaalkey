import { useRef, useState } from "react";
import { Platform, ScrollView, View, useWindowDimensions } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createAccountOtpAuthUrl } from "../services/otp-auth-uri";
import { styles, getWebRootPanelStyle } from "../styles/home.styles";
import SplashScreen from "../components/SplashScreen";
import LegalNoticeScreen from "../components/LegalNoticeScreen";
import VaultLockScreen from "../components/VaultLockScreen";
import AccountQrModal from "../components/AccountQrModal";
import AccountEditorModal from "../components/AccountEditorModal";
import QrScannerModal from "../components/QrScannerModal";
import SettingsBackupActivityModals from "../components/SettingsBackupActivityModals";
import { useQrImageImport } from "../hooks/useQrImageImport";
import { useCodeClipboard } from "../hooks/useCodeClipboard";
import { useAccountQrModal } from "../hooks/useAccountQrModal";
import { useHomeLifecycle } from "../hooks/useHomeLifecycle";
import { showUserMessage as showBackupMessage } from "../utils/user-message";
import { useBackupManager } from "../hooks/useBackupManager";
import { useAccounts } from "../hooks/useAccounts";
import { useLegalAcceptance } from "../hooks/useLegalAcceptance";
import { useBiometricLock } from "../hooks/useBiometricLock";
import { useQrAccountScanner } from "../hooks/useQrAccountScanner";
import { useHaptics } from "../hooks/useHaptics";
import { useAccountList } from "../hooks/useAccountList";
import { useScannerCameraHeight } from "../hooks/useScannerCameraHeight";
import { useHomeModalState } from "../hooks/useHomeModalState";
import { useHomeOverlayState } from "../hooks/useHomeOverlayState";
import AccountSectionHeader from "../components/AccountSectionHeader";
import HomeHeader from "../components/HomeHeader";
import HomeFooter from "../components/HomeFooter";
import AccountListToolbar from "../components/AccountListToolbar";
import AccountListContent from "../components/AccountListContent";
import DesktopProductInfo from "../components/DesktopProductInfo";

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const showDesktopBranding = Platform.OS === "web" && windowWidth >= 900;
  const [appPanelWidth, setAppPanelWidth] = useState(0);
  const initialAppPanelWidth = Math.max(400, Math.min(windowWidth * 0.27, windowWidth - 334));
  const currentAppPanelWidth = appPanelWidth || initialAppPanelWidth;
  const splitterDragStart = useRef<{ pointerX: number; panelWidth: number } | null>(null);

  const onSplitterMouseDown = (event: any) => {
    // React Native Web exposes DOM coordinates on nativeEvent; fall back to the
    // synthetic event for browser builds that expose them directly.
    const nativeEvent = event?.nativeEvent ?? event;
    const pointerX = nativeEvent?.clientX ?? nativeEvent?.pageX;
    if (typeof pointerX !== "number" || (nativeEvent?.button != null && nativeEvent.button !== 0))
      return;

    event?.preventDefault?.();
    nativeEvent?.preventDefault?.();
    splitterDragStart.current = { pointerX, panelWidth: currentAppPanelWidth };

    const onMove = (moveEvent: MouseEvent) => {
      const drag = splitterDragStart.current;
      if (!drag) return;
      const moveX = moveEvent.clientX;
      if (typeof moveX !== "number") return;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const splitterWidth = 14;
      const brandMinimumWidth = 320;
      const maxAppWidth = Math.max(400, viewportWidth - brandMinimumWidth - splitterWidth);
      const nextWidth = Math.max(
        400,
        Math.min(maxAppWidth, drag.panelWidth + moveX - drag.pointerX),
      );
      setAppPanelWidth(nextWidth);
      moveEvent.preventDefault();
    };

    const stopDragging = () => {
      splitterDragStart.current = null;
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", stopDragging, true);
      window.removeEventListener("blur", stopDragging);
    };

    // Capture at document level so dragging continues even when the pointer
    // leaves the narrow splitter surface.
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", stopDragging, true);
    window.addEventListener("blur", stopDragging);
  };

  const insets = useSafeAreaInsets();
  const scannerCameraHeight = useScannerCameraHeight();
  const { now, showBrandSplash } = useHomeLifecycle();
  const {
    settingsVisible,
    setSettingsVisible,
    backupVisible,
    setBackupVisible,
    backupMode,
    setBackupMode,
    backupPassword,
    setBackupPassword,
    backupBusy,
    setBackupBusy,
    activityMessage,
    setActivityMessage,
  } = useHomeModalState();
  const { hapticsEnabled, hapticFeedback, toggleHaptics } = useHaptics();
  const { copyCode } = useCodeClipboard(hapticFeedback);
  const {
    legalLoaded,
    legalAccepted,
    legalChecked,
    setLegalChecked,
    legalReviewVisible,
    setLegalReviewVisible,
    legalDocument,
    setLegalDocument,
    legalSaving,
    acceptLegalNotice,
  } = useLegalAcceptance();
  const {
    biometricEnabled,
    biometricReady,
    isUnlocked,
    authenticating,
    authenticateUser,
    toggleBiometricLock,
  } = useBiometricLock();

  const { modalVisible, setModalVisible, scannerVisible, setScannerVisible } =
    useHomeOverlayState();
  const {
    accounts,
    setAccounts,
    loaded,
    editingId,
    setEditingId,
    issuer,
    setIssuer,
    accountName,
    setAccountName,
    secret,
    setSecret,
    totpUrlInput,
    setTotpUrlInput,
    manualExpanded,
    setManualExpanded,
    otpAlgorithm,
    setOtpAlgorithm,
    otpDigits,
    setOtpDigits,
    otpPeriod,
    setOtpPeriod,
    saveAccounts,
    openAddAccount,
    openEditAccount,
    saveAccount,
    deleteAccount,
    clearAllAccounts,
  } = useAccounts({
    showMessage: showBackupMessage,
    hapticFeedback,
    setScannerVisible,
    setModalVisible,
  });
  const {
    scanned,
    scannerDiagnostic,
    setScannerDiagnostic,
    cameraPermission,
    qrProcessingRef,
    cameraViewRef,
    openQrScanner,
    handleQrScanned,
    importTotpUrl,
    pasteTotpUrl: pasteTotpUrlFromClipboard,
  } = useQrAccountScanner({
    accounts,
    saveAccounts,
    setEditingId,
    setModalVisible,
    setScannerVisible,
    setActivityMessage,
    showMessage: showBackupMessage,
    hapticFeedback,
  });

  const { importQrImage, pasteQrImage } = useQrImageImport({
    onQrScanned: handleQrScanned,
    modalVisible,
    editingId,
    setActivityMessage,
  });
  const { openBackup, exportEncryptedBackup, restoreEncryptedBackup } = useBackupManager({
    accounts,
    setAccounts,
    backupPassword,
    setBackupPassword,
    setBackupBusy,
    setActivityMessage,
    setBackupVisible,
    setBackupMode,
    setSettingsVisible,
    showBackupMessage,
    hapticFeedback,
  });
  const { qrAccount, qrRevealed, setQrRevealed, openAccountQr, closeAccountQr } =
    useAccountQrModal(hapticFeedback);

  async function pasteTotpUrl() {
    await pasteTotpUrlFromClipboard(setTotpUrlInput);
  }

  // Android uses CameraView.onBarcodeScanned directly, matching the earlier working scanner.
  // Do not capture still images periodically; keep the live preview uninterrupted.

  const { searchQuery, setSearchQuery, sortBy, setSortBy, visibleAccounts } =
    useAccountList(accounts);

  // Keep startup branding separate from the main screen implementation.
  if (showBrandSplash || !legalLoaded) return <SplashScreen />;

  // The vault remains hidden until the legal notice has been accepted.
  if (!legalAccepted || legalReviewVisible) {
    return (
      <LegalNoticeScreen
        firstLaunch={!legalAccepted}
        legalDocument={legalDocument}
        setLegalDocument={setLegalDocument}
        legalChecked={legalChecked}
        setLegalChecked={setLegalChecked}
        legalSaving={legalSaving}
        onAccept={() => void acceptLegalNotice()}
        onDone={() => setLegalReviewVisible(false)}
      />
    );
  }

  // Do not render the account screen beneath the lock overlay.
  if (!biometricReady || (biometricEnabled && !isUnlocked)) {
    return (
      <VaultLockScreen
        biometricReady={biometricReady}
        authenticating={authenticating}
        onUnlock={() => void authenticateUser()}
      />
    );
  }

  return (
    <View style={showDesktopBranding ? styles.webDesktopLayout : styles.webMobileLayout}>
      <SafeAreaView
        style={
          Platform.OS === "web"
            ? showDesktopBranding
              ? [styles.webRoot, getWebRootPanelStyle(currentAppPanelWidth)]
              : styles.webMobileRoot
            : styles.container
        }
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={Platform.OS === "web" ? styles.webAppShell : styles.nativeAppShell}>
          <HomeHeader
            biometricEnabled={biometricEnabled}
            onToggleBiometricLock={() => void toggleBiometricLock()}
            onOpenSettings={() => {
              hapticFeedback("selection");
              setSettingsVisible(true);
            }}
          />

          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom + 24, 48) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AccountSectionHeader accountCount={accounts.length} onAddAccount={openAddAccount} />

            {accounts.length > 0 && (
              <AccountListToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                hapticFeedback={hapticFeedback}
              />
            )}

            <AccountListContent
              loaded={loaded}
              accounts={accounts}
              visibleAccounts={visibleAccounts}
              now={now}
              onAddAccount={openAddAccount}
              onCopyCode={copyCode}
              onViewQr={openAccountQr}
              onEdit={openEditAccount}
              onDelete={deleteAccount}
            />

            <HomeFooter />
          </ScrollView>

          <AccountQrModal
            qrAccount={qrAccount}
            qrRevealed={qrRevealed}
            setQrRevealed={setQrRevealed}
            insets={insets}
            createAccountOtpAuthUrl={createAccountOtpAuthUrl}
            closeAccountQr={closeAccountQr}
          />

          <AccountEditorModal
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            editingId={editingId}
            setEditingId={setEditingId}
            issuer={issuer}
            setIssuer={setIssuer}
            accountName={accountName}
            setAccountName={setAccountName}
            secret={secret}
            setSecret={setSecret}
            totpUrlInput={totpUrlInput}
            setTotpUrlInput={setTotpUrlInput}
            manualExpanded={manualExpanded}
            setManualExpanded={setManualExpanded}
            otpAlgorithm={otpAlgorithm}
            setOtpAlgorithm={setOtpAlgorithm}
            otpDigits={otpDigits}
            setOtpDigits={setOtpDigits}
            otpPeriod={otpPeriod}
            setOtpPeriod={setOtpPeriod}
            insets={insets}
            openQrScanner={openQrScanner}
            importQrImage={importQrImage}
            pasteQrImage={pasteQrImage}
            importTotpUrl={importTotpUrl}
            pasteTotpUrl={pasteTotpUrl}
            saveAccount={saveAccount}
          />

          <QrScannerModal
            scannerVisible={scannerVisible}
            setScannerVisible={setScannerVisible}
            setModalVisible={setModalVisible}
            qrProcessingRef={qrProcessingRef}
            insets={insets}
            scannerCameraHeight={scannerCameraHeight}
            scanned={scanned}
            scannerDiagnostic={scannerDiagnostic}
            setScannerDiagnostic={setScannerDiagnostic}
            cameraPermission={cameraPermission}
            cameraViewRef={cameraViewRef}
            handleQrScanned={handleQrScanned}
          />

          <SettingsBackupActivityModals
            insets={insets}
            settingsVisible={settingsVisible}
            setSettingsVisible={setSettingsVisible}
            hapticsEnabled={hapticsEnabled}
            toggleHaptics={toggleHaptics}
            biometricEnabled={biometricEnabled}
            toggleBiometricLock={toggleBiometricLock}
            openBackup={openBackup}
            setLegalReviewVisible={setLegalReviewVisible}
            setLegalDocument={setLegalDocument}
            backupVisible={backupVisible}
            setBackupVisible={setBackupVisible}
            backupMode={backupMode}
            backupPassword={backupPassword}
            setBackupPassword={setBackupPassword}
            accounts={accounts}
            backupBusy={backupBusy}
            exportEncryptedBackup={exportEncryptedBackup}
            restoreEncryptedBackup={restoreEncryptedBackup}
            activityMessage={activityMessage}
            clearAllAccounts={clearAllAccounts}
          />
        </View>
      </SafeAreaView>
      {showDesktopBranding && (
        <>
          <View
            {...({ onMouseDown: onSplitterMouseDown } as any)}
            style={styles.webDesktopSplitter}
            accessibilityRole="adjustable"
            accessibilityLabel="Resize app and brand panels"
          >
            <View style={styles.webDesktopSplitterGrip}>
              <View style={styles.webDesktopSplitterGripLine} />
              <View style={styles.webDesktopSplitterGripLine} />
              <View style={styles.webDesktopSplitterGripLine} />
            </View>
          </View>
          <View style={[styles.webBrandPanel, styles.webBrandPanelContent]}>
            <DesktopProductInfo />
          </View>
        </>
      )}
    </View>
  );
}
