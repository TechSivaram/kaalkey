import type { Dispatch, SetStateAction } from "react";
import * as Clipboard from "expo-clipboard";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Account } from "../types/account";
import { styles } from "../styles/home.styles";
import {
  BUTTON_ACTIVE_OPACITY,
  BUTTON_ACTIVE_OPACITY_SOFT,
  BUTTON_ACTIVE_OPACITY_STRONG,
} from "../constants/ui";
import type { BackupMode } from "../types/backupMode";
import { getBackupModalDescription } from "../utils/backupModalDescription";
import { showUserMessage } from "../utils/user-message";
import { COLORS } from "../constants/colors";
import { USER_MESSAGES } from "../constants/userMessages";
import ActivityOverlayModal from "./ActivityOverlayModal";
import {
  settingsBackupActivityStyles as inlineStyles,
  getSettingsBackdropStyles,
} from "../styles/component.styles";

type Props = {
  insets: { top: number; bottom: number };
  settingsVisible: boolean;
  setSettingsVisible: Dispatch<SetStateAction<boolean>>;
  hapticsEnabled: boolean;
  toggleHaptics: () => Promise<void>;
  biometricEnabled: boolean;
  toggleBiometricLock: () => Promise<void>;
  openBackup: (mode: BackupMode) => void;
  setLegalReviewVisible: Dispatch<SetStateAction<boolean>>;
  setLegalDocument: Dispatch<SetStateAction<"privacy" | "terms">>;
  backupVisible: boolean;
  setBackupVisible: Dispatch<SetStateAction<boolean>>;
  backupMode: BackupMode;
  backupPassword: string;
  setBackupPassword: Dispatch<SetStateAction<string>>;
  accounts: Account[];
  backupBusy: boolean;
  exportEncryptedBackup: () => Promise<void>;
  restoreEncryptedBackup: () => Promise<void>;
  activityMessage: string | null;
  clearAllAccounts: () => void;
};

/** Settings, backup, and blocking activity dialogs for the vault screen. */
export default function SettingsBackupActivityModals(props: Props) {
  const {
    insets,
    settingsVisible,
    setSettingsVisible,
    hapticsEnabled,
    toggleHaptics,
    biometricEnabled,
    toggleBiometricLock,
    openBackup,
    setLegalReviewVisible,
    setLegalDocument,
    backupVisible,
    setBackupVisible,
    backupMode,
    backupPassword,
    setBackupPassword,
    accounts,
    backupBusy,
    exportEncryptedBackup,
    restoreEncryptedBackup,
    activityMessage,
    clearAllAccounts,
  } = props;
  return (
    <>
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={[styles.settingsBackdrop, ...getSettingsBackdropStyles(insets)]}>
          <View style={styles.settingsSheet}>
            <ScrollView
              style={styles.settingsScroll}
              contentContainerStyle={styles.settingsScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.settingsTopRow}>
                <View style={styles.dialogTitleCopy}>
                  <Text style={styles.settingsEyebrow}>KAALKEY PREFERENCES</Text>
                  <Text style={styles.settingsTitle}>App settings</Text>
                </View>
                <TouchableOpacity
                  style={styles.settingsCloseButton}
                  hitSlop={10}
                  onPress={() => setSettingsVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close settings"
                >
                  <Text style={styles.settingsCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>EXPERIENCE</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>📳</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>Haptic feedback</Text>
                  <Text style={styles.settingDescription}>
                    Gentle feedback for taps and completed actions.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingSwitch, hapticsEnabled && styles.settingSwitchOn]}
                  onPress={() => void toggleHaptics()}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticsEnabled }}
                  accessibilityLabel="Haptic feedback"
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      hapticsEnabled && styles.settingSwitchThumbOn,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>SECURITY</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🔐</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>Device authentication lock</Text>
                  <Text style={styles.settingDescription}>
                    {biometricEnabled
                      ? "Your vault locks when KaalKey leaves the foreground."
                      : "Require your phone’s biometrics or screen-lock PIN, pattern, or password."}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingSwitch, biometricEnabled && styles.settingSwitchOn]}
                  onPress={() => void toggleBiometricLock()}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: biometricEnabled }}
                  accessibilityLabel="Device authentication app lock"
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      biometricEnabled && styles.settingSwitchThumbOn,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>BACKUP & RECOVERY</Text>
              <View style={styles.backupButtonsRow}>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("export")}
                  activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
                >
                  <Text style={styles.backupActionIcon}>⬆</Text>
                  <Text style={styles.backupActionTitle}>Create backup</Text>
                  <Text style={styles.backupActionDescription}>Encrypted file</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("restore")}
                  activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
                >
                  <Text style={styles.backupActionIcon}>⬇</Text>
                  <Text style={styles.backupActionTitle}>Restore backup</Text>
                  <Text style={styles.backupActionDescription}>Import file</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.backupSafetyText}>
                Backups contain your authenticator secrets. KaalKey generates a unique password for
                each backup. Save it separately; KaalKey cannot recover it.
              </Text>

              <Text style={styles.settingsSectionLabel}>DANGER ZONE</Text>
              <TouchableOpacity
                style={[styles.settingRow, inlineStyles.clearAllRow]}
                onPress={clearAllAccounts}
                accessibilityRole="button"
                accessibilityLabel="Clear all authenticator accounts"
              >
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🗑️</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={[styles.settingTitleText, inlineStyles.clearAllTitle]}>Clear all accounts</Text>
                  <Text style={styles.settingDescription}>
                    Permanently remove every account and secret from this device. Back up first.
                  </Text>
                </View>
                <Text style={inlineStyles.clearAllChevron}>›</Text>
              </TouchableOpacity>

              <Text style={styles.settingsSectionLabel}>APPEARANCE</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>☀️</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>Light appearance</Text>
                  <Text style={styles.settingDescription}>
                    KaalKey currently uses its clean light theme.
                  </Text>
                </View>
                <View style={styles.appearanceBadge}>
                  <Text style={styles.appearanceBadgeText}>ACTIVE</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingRow, inlineStyles.settingRowOffset]}
                onPress={() => {
                  setSettingsVisible(false);
                  setLegalDocument("privacy");
                  setLegalReviewVisible(true);
                }}
                accessibilityRole="button"
              >
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>📄</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>Legal & privacy</Text>
                  <Text style={styles.settingDescription}>
                    Review the Privacy Policy and Terms of Use.
                  </Text>
                </View>
                <Text style={inlineStyles.legalChevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.settingsPrivacyNote}>
                <Text style={styles.settingsPrivacyIcon}>🛡️</Text>
                <Text style={styles.settingsPrivacyText}>
                  Your authenticator secrets stay in the on-device secure vault. Preferences are
                  stored locally.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settingsDoneButton}
                onPress={() => setSettingsVisible(false)}
                activeOpacity={BUTTON_ACTIVE_OPACITY_STRONG}
              >
                <Text style={styles.settingsDoneText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={backupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setBackupVisible(false);
          setBackupPassword("");
        }}
      >
        <View style={[styles.settingsBackdrop, ...getSettingsBackdropStyles(insets, true)]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.backupModalWrap}
          >
            <ScrollView
              style={styles.backupModalScroll}
              contentContainerStyle={styles.backupModalScrollContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.backupModal}>
                <View style={styles.settingsTopRow}>
                  <View style={styles.dialogTitleCopy}>
                    <Text style={styles.settingsEyebrow}>SECURE VAULT</Text>
                    <Text style={styles.settingsTitle}>
                      {backupMode === "export" ? "Create backup" : "Restore backup"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingsCloseButton}
                    hitSlop={10}
                    onPress={() => {
                      setBackupVisible(false);
                      setBackupPassword("");
                    }}
                    accessibilityLabel="Close backup"
                    accessibilityRole="button"
                  >
                    <Text style={styles.settingsCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.backupModalDescription}>
                  {getBackupModalDescription(backupMode, accounts.length)}
                </Text>
                <Text style={styles.inputLabel}>BACKUP PASSWORD</Text>
                {backupMode === "export" ? (
                  <View>
                    <View
                      style={styles.backupPasswordCard}
                    >
                      <Text
                        selectable
                        style={styles.backupPasswordText}
                      >
                        {backupPassword || "Generating secure password…"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cancelButton, styles.backupCopyButton]}
                      disabled={!backupPassword || backupBusy}
                      onPress={() => {
                        void Clipboard.setStringAsync(backupPassword)
                          .then(() => {
                            showUserMessage(USER_MESSAGES.backup.passwordCopiedTitle, USER_MESSAGES.backup.passwordCopiedBody);
                          })
                          .catch(() => {
                            showUserMessage(USER_MESSAGES.backup.copyFailedTitle, USER_MESSAGES.backup.copyFailedBody);
                          });
                      }}
                      activeOpacity={BUTTON_ACTIVE_OPACITY}
                      accessibilityRole="button"
                      accessibilityLabel="Copy generated backup password"
                    >
                      <Text
                        style={[styles.cancelButtonText, styles.backupCopyButtonText]}
                      >
                        Copy generated password
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.backupSafetyText}>
                      Save this password separately (for example, in WhatsApp). Anyone with both the
                      backup file and password can restore your authenticator accounts.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputClearWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithClearSpace]}
                      value={backupPassword}
                      onChangeText={setBackupPassword}
                      placeholder="Enter backup password"
                      placeholderTextColor={COLORS.placeholder}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      accessibilityLabel="Backup password"
                    />
                    {backupPassword.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearInputButton}
                        onPress={() => setBackupPassword("")}
                        activeOpacity={BUTTON_ACTIVE_OPACITY}
                        accessibilityRole="button"
                        accessibilityLabel="Clear backup password"
                        hitSlop={6}
                      >
                        <Text style={styles.clearInputButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, backupBusy && styles.backupDisabled]}
                  disabled={backupBusy}
                  onPress={() =>
                    void (backupMode === "export"
                      ? exportEncryptedBackup()
                      : restoreEncryptedBackup())
                  }
                >
                  <Text style={styles.primaryButtonText}>
                    {backupBusy
                      ? "Please wait…"
                      : backupMode === "export"
                        ? "Encrypt and share backup"
                        : "Choose file and import"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setBackupVisible(false);
                    setBackupPassword("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <ActivityOverlayModal insets={insets} activityMessage={activityMessage} />
    </>
  );
}
