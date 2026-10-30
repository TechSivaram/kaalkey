import * as Clipboard from "expo-clipboard";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
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
import { COLORS } from "../constants/colors";
import {
  BUTTON_ACTIVE_OPACITY,
  BUTTON_ACTIVE_OPACITY_SOFT,
  BUTTON_ACTIVE_OPACITY_STRONG,
} from "../constants/ui";
import { USER_MESSAGES } from "../constants/userMessages";
import type { AppLanguage } from "../i18n";
import { SUPPORTED_LANGUAGES, translate } from "../i18n";
import {
  getSettingsBackdropStyles,
  settingsBackupActivityStyles as inlineStyles,
} from "../styles/component.styles";
import { styles } from "../styles/home.styles";
import type { Account } from "../types/account";
import type { BackupMode } from "../types/backupMode";
import { getBackupModalDescription } from "../utils/backupModalDescription";
import { showUserMessage } from "../utils/user-message";
import ActivityOverlayModal from "./ActivityOverlayModal";

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
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
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
    language,
    setLanguage,
  } = props;
  const [languageSearch, setLanguageSearch] = useState("");
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const openLanguageDropdown = () => setLanguageDropdownOpen(true);
  const handleLanguageSelect = (selectedLanguage: AppLanguage) => {
    // Close the dropdown immediately, before updating the app language.
    setLanguageDropdownOpen(false);
    setLanguageSearch("");
    setLanguage(selectedLanguage);
  };
  const matchingLanguages = useMemo(() => {
    const query = languageSearch.trim().toLocaleLowerCase();
    if (!query) return SUPPORTED_LANGUAGES.slice(0, 5);
    return SUPPORTED_LANGUAGES.filter((item) =>
      `${item.name} ${item.nativeName} ${item.code} ${item.searchTerms}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [languageSearch]);
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
                  <Text style={styles.settingsEyebrow}>
                    {translate(language, "KAALKEY PREFERENCES")}
                  </Text>
                  <Text style={styles.settingsTitle}>{translate(language, "App settings")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.settingsCloseButton}
                  hitSlop={10}
                  onPress={() => setSettingsVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel={translate(language, "Close settings")}
                >
                  <Text style={styles.settingsCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>{translate(language, "LANGUAGE")}</Text>
              <View style={[styles.settingRow, languageDropdownOpen && { zIndex: 30 }]}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🌐</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>{translate(language, "language")}</Text>
                  <Text style={styles.settingDescription}>
                    {translate(language, "languageDescription")}
                  </Text>
                  <View
                    style={{
                      position: "relative",
                      zIndex: languageDropdownOpen ? 30 : 0,
                    }}
                  >
                    <TextInput
                      value={languageSearch}
                      onFocus={openLanguageDropdown}
                      onChangeText={(value) => {
                        setLanguageSearch(value);
                        openLanguageDropdown();
                      }}
                      placeholder={translate(language, "Search language (name or code)")}
                      placeholderTextColor="#718096"
                      accessibilityLabel={translate(language, "Search supported languages")}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{
                        marginTop: 10,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: "#D6DEE7",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        color: "#243447",
                        backgroundColor: "#FFFFFF",
                        elevation: 0,
                        shadowColor: "transparent",
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }}
                    />
                    {languageDropdownOpen ? (
                      <View
                        style={{
                          position: "absolute",
                          top: 56,
                          left: 0,
                          right: 0,
                          maxHeight: 260,
                          padding: 6,
                          gap: 6,
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: "#D6DEE7",
                          borderRadius: 12,
                          zIndex: 10000,
                          elevation: 8,
                          shadowColor: "#000000",
                          shadowOpacity: 0.12,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 3 },
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            paddingHorizontal: 4,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => setLanguageDropdownOpen(false)}
                            accessibilityRole="button"
                            accessibilityLabel={translate(language, "Close language dropdown")}
                            hitSlop={12}
                          >
                            <Text
                              style={{
                                color: "#243447",
                                fontWeight: "800",
                                fontSize: 18,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                              }}
                            >
                              ✕
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <ScrollView keyboardShouldPersistTaps="always" style={{ maxHeight: 208 }}>
                          {matchingLanguages.map((item) => (
                            <TouchableOpacity
                              key={item.code}
                              onPress={() => handleLanguageSelect(item.code)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: language === item.code }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingVertical: 9,
                                paddingHorizontal: 12,
                                borderRadius: 10,
                                backgroundColor:
                                  language === item.code ? COLORS.indiaGreen : "#E8EDF2",
                              }}
                            >
                              <View>
                                <Text
                                  style={{
                                    color: language === item.code ? "#FFFFFF" : "#243447",
                                    fontWeight: "700",
                                  }}
                                >
                                  {item.nativeName}
                                </Text>
                                <Text
                                  style={{
                                    color: language === item.code ? "#EAF7EF" : "#536477",
                                    fontSize: 12,
                                  }}
                                >
                                  {item.name} · {item.code}
                                </Text>
                              </View>
                              {language === item.code ? (
                                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>✓</Text>
                              ) : null}
                            </TouchableOpacity>
                          ))}
                          {matchingLanguages.length === 0 ? (
                            <Text style={{ color: "#536477", paddingVertical: 8 }}>
                              {translate(language, "No translated language found.")}
                            </Text>
                          ) : null}
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <Text style={styles.settingsSectionLabel}>{translate(language, "EXPERIENCE")}</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>📳</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>
                    {translate(language, "Haptic feedback")}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {translate(language, "Gentle feedback for taps and completed actions.")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingSwitch, hapticsEnabled && styles.settingSwitchOn]}
                  onPress={() => void toggleHaptics()}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticsEnabled }}
                  accessibilityLabel={translate(language, "Haptic feedback")}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      hapticsEnabled && styles.settingSwitchThumbOn,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>{translate(language, "SECURITY")}</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🔐</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>
                    {translate(language, "Device authentication lock")}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {biometricEnabled
                      ? translate(language, "Your vault locks when KaalKey leaves the foreground.")
                      : translate(
                          language,
                          "Require your phone’s biometrics or screen-lock PIN, pattern, or password.",
                        )}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingSwitch, biometricEnabled && styles.settingSwitchOn]}
                  onPress={() => void toggleBiometricLock()}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: biometricEnabled }}
                  accessibilityLabel={translate(language, "Device authentication app lock")}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      biometricEnabled && styles.settingSwitchThumbOn,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>
                {translate(language, "BACKUP & RECOVERY")}
              </Text>
              <View style={styles.backupButtonsRow}>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("export")}
                  activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
                >
                  <Text style={styles.backupActionIcon}>⬆</Text>
                  <Text style={styles.backupActionTitle}>
                    {translate(language, "Create backup")}
                  </Text>
                  <Text style={styles.backupActionDescription}>
                    {translate(language, "Encrypted file")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("restore")}
                  activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
                >
                  <Text style={styles.backupActionIcon}>⬇</Text>
                  <Text style={styles.backupActionTitle}>
                    {translate(language, "Restore backup")}
                  </Text>
                  <Text style={styles.backupActionDescription}>
                    {translate(language, "Import file")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.backupSafetyText}>
                {translate(language, "Backup safety note")}
              </Text>

              <Text style={styles.settingsSectionLabel}>{translate(language, "DANGER ZONE")}</Text>
              <TouchableOpacity
                style={[styles.settingRow, inlineStyles.clearAllRow]}
                onPress={clearAllAccounts}
                accessibilityRole="button"
                accessibilityLabel={translate(language, "Clear all authenticator accounts")}
              >
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🗑️</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={[styles.settingTitleText, inlineStyles.clearAllTitle]}>
                    {translate(language, "Clear all accounts")}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {translate(
                      language,
                      "Permanently remove every account and secret from this device. Back up first.",
                    )}
                  </Text>
                </View>
                <Text style={inlineStyles.clearAllChevron}>›</Text>
              </TouchableOpacity>

              <Text style={styles.settingsSectionLabel}>{translate(language, "APPEARANCE")}</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>☀️</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>
                    {translate(language, "Light appearance")}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {translate(language, "KaalKey currently uses its clean light theme.")}
                  </Text>
                </View>
                <View style={styles.appearanceBadge}>
                  <Text style={styles.appearanceBadgeText}>{translate(language, "ACTIVE")}</Text>
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
                  <Text style={styles.settingTitleText}>
                    {translate(language, "Legal & privacy")}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {translate(language, "Review the Privacy Policy and Terms of Use.")}
                  </Text>
                </View>
                <Text style={inlineStyles.legalChevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.settingsPrivacyNote}>
                <Text style={styles.settingsPrivacyIcon}>🛡️</Text>
                <Text style={styles.settingsPrivacyText}>
                  {translate(
                    language,
                    "Your authenticator secrets stay in the on-device secure vault. Preferences are stored locally.",
                  )}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settingsDoneButton}
                onPress={() => setSettingsVisible(false)}
                activeOpacity={BUTTON_ACTIVE_OPACITY_STRONG}
              >
                <Text style={styles.settingsDoneText}>{translate(language, "Done")}</Text>
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
                    <Text style={styles.settingsEyebrow}>
                      {translate(language, "SECURE VAULT")}
                    </Text>
                    <Text style={styles.settingsTitle}>
                      {backupMode === "export"
                        ? translate(language, "Create backup")
                        : translate(language, "Restore backup")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingsCloseButton}
                    hitSlop={10}
                    onPress={() => {
                      setBackupVisible(false);
                      setBackupPassword("");
                    }}
                    accessibilityLabel={translate(language, "Close backup")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.settingsCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.backupModalDescription}>
                  {getBackupModalDescription(backupMode, accounts.length, language)}
                </Text>
                <Text style={styles.inputLabel}>{translate(language, "BACKUP PASSWORD")}</Text>
                {backupMode === "export" ? (
                  <View>
                    <View style={styles.backupPasswordCard}>
                      <Text selectable style={styles.backupPasswordText}>
                        {backupPassword || translate(language, "Generating secure password…")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cancelButton, styles.backupCopyButton]}
                      disabled={!backupPassword || backupBusy}
                      onPress={() => {
                        void Clipboard.setStringAsync(backupPassword)
                          .then(() => {
                            showUserMessage(
                              USER_MESSAGES.backup.passwordCopiedTitle,
                              USER_MESSAGES.backup.passwordCopiedBody,
                            );
                          })
                          .catch(() => {
                            showUserMessage(
                              USER_MESSAGES.backup.copyFailedTitle,
                              USER_MESSAGES.backup.copyFailedBody,
                            );
                          });
                      }}
                      activeOpacity={BUTTON_ACTIVE_OPACITY}
                      accessibilityRole="button"
                      accessibilityLabel={translate(language, "Copy generated backup password")}
                    >
                      <Text style={[styles.cancelButtonText, styles.backupCopyButtonText]}>
                        {translate(language, "Copy generated password")}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.backupSafetyText}>
                      {translate(
                        language,
                        "Save this password separately (for example, in WhatsApp). Anyone with both the",
                      )}
                      {translate(
                        language,
                        "backup file and password can restore your authenticator accounts.",
                      )}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputClearWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithClearSpace]}
                      value={backupPassword}
                      onChangeText={setBackupPassword}
                      placeholder={translate(language, "Enter backup password")}
                      placeholderTextColor={COLORS.placeholder}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      accessibilityLabel={translate(language, "Backup password")}
                    />
                    {backupPassword.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearInputButton}
                        onPress={() => setBackupPassword("")}
                        activeOpacity={BUTTON_ACTIVE_OPACITY}
                        accessibilityRole="button"
                        accessibilityLabel={translate(language, "Clear backup password")}
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
                      ? translate(language, "Please wait…")
                      : backupMode === "export"
                        ? translate(language, "Encrypt and share backup")
                        : translate(language, "Choose file and import")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setBackupVisible(false);
                    setBackupPassword("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>{translate(language, "Cancel")}</Text>
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
