import type { Dispatch, SetStateAction } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Account } from "../types/account";
import { styles } from "../styles/home.styles";
import { MIN_BACKUP_PASSWORD_LENGTH } from "../constants/backup";
import {
  BUTTON_ACTIVE_OPACITY,
  BUTTON_ACTIVE_OPACITY_SOFT,
  BUTTON_ACTIVE_OPACITY_STRONG,
} from "../constants/ui";
import { COLORS } from "../constants/colors";
import ActivityOverlayModal from "./ActivityOverlayModal";

type BackupMode = "export" | "restore";
type Props = {
  insets: { top: number; bottom: number };
  settingsVisible: boolean; setSettingsVisible: Dispatch<SetStateAction<boolean>>;
  hapticsEnabled: boolean; toggleHaptics: () => Promise<void>;
  biometricEnabled: boolean; toggleBiometricLock: () => Promise<void>;
  openBackup: (mode: BackupMode) => void;
  setLegalReviewVisible: Dispatch<SetStateAction<boolean>>;
  setLegalDocument: Dispatch<SetStateAction<"privacy" | "terms">>;
  backupVisible: boolean; setBackupVisible: Dispatch<SetStateAction<boolean>>;
  backupMode: BackupMode;
  backupPassword: string; setBackupPassword: Dispatch<SetStateAction<string>>;
  accounts: Account[]; backupBusy: boolean;
  exportEncryptedBackup: () => Promise<void>;
  restoreEncryptedBackup: () => Promise<void>;
  activityMessage: string | null;
};

/** Settings, backup, and blocking activity dialogs for the vault screen. */
export default function SettingsBackupActivityModals(props: Props) {
  const {
    insets, settingsVisible, setSettingsVisible, hapticsEnabled, toggleHaptics,
    biometricEnabled, toggleBiometricLock, openBackup, setLegalReviewVisible, setLegalDocument,
    backupVisible, setBackupVisible, backupMode, backupPassword, setBackupPassword,
    accounts, backupBusy, exportEncryptedBackup, restoreEncryptedBackup, activityMessage,
  } = props;
  return (
    <>
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View
          style={[
            styles.settingsBackdrop,
            { paddingHorizontal: 16 },
            Platform.OS === "android" && {
              paddingTop: Math.max(insets.top + 12, 28),
              paddingBottom: Math.max(insets.bottom + 12, 28),
            },
          ]}
        >
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
                Backups contain your authenticator secrets. They are encrypted with a password you
                choose. Keep that password safe; KaalKey cannot recover it.
              </Text>

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
                style={[styles.settingRow, { marginTop: 8 }]}
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
                <Text style={{ color: "#60718A", fontSize: 20 }}>›</Text>
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
        <View
          style={[
            styles.settingsBackdrop,
            { paddingHorizontal: 12 },
            Platform.OS === "android" && {
              paddingTop: Math.max(insets.top + 12, 28),
              paddingBottom: Math.max(insets.bottom + 12, 28),
            },
          ]}
        >
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
                  {backupMode === "export"
                    ? `Encrypt all ${accounts.length} saved account${accounts.length === 1 ? "" : "s"} into a backup file. Choose a strong password and store the file somewhere private.`
                    : "Choose your KaalKey backup file and password. New accounts will be added to your existing account list; existing accounts will stay as they are."}
                </Text>
                <Text style={styles.inputLabel}>BACKUP PASSWORD</Text>
                <View style={styles.inputClearWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputWithClearSpace]}
                    value={backupPassword}
                    onChangeText={setBackupPassword}
                    placeholder={
                      backupMode === "export"
                        ? `At least ${MIN_BACKUP_PASSWORD_LENGTH} characters`
                        : "Enter backup password"
                    }
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
                {backupMode === "export" && (
                  <Text style={styles.backupSafetyText}>
                    Use a unique password with at least {MIN_BACKUP_PASSWORD_LENGTH} characters. If you lose it, the backup
                    cannot be decrypted.
                  </Text>
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
