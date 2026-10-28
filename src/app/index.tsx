import { ScrollView } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createAccountOtpAuthUrl } from "../services/otp-auth-uri";
import { styles } from "../styles/home.styles";
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

export default function HomeScreen() {
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
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
      />
    </SafeAreaView>
  );
}
