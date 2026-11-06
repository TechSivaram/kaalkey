import { isIOS } from "../platform/runtime";
import { clipboard } from "../platform/clipboard/clipboard";
import { memo, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { type AppLanguage, useAppLanguage } from "../i18n";
import {
  KeyboardAvoidingView,
  Modal,
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
import { createUserMessages } from "../constants/userMessages";
import {
  getSettingsBackdropStyles,
  settingsBackupActivityStyles as inlineStyles,
} from "../styles/component.styles";
import { styles } from "../styles/home.styles";
import type { Account } from "../types/account";
import type { BackupMode } from "../types/backupMode";
import { getBackupModalDescription } from "../utils/backupModalDescription";
import { showUserMessage } from "../utils/user-message";
import LanguageSelector from "./LanguageSelector";
import { settingsLanguageStyles } from "./settings-language.styles";

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
  clearAllAccounts: () => void;
};

/** Settings, backup, and blocking activity dialogs for the vault screen. */
function SettingsBackupActivityModals(props: Props) {
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
    clearAllAccounts,
  } = props;
  const {
    language,
    t,
    setLanguage,
    languages,
    languageLoading,
    translationLoading,
    translationServerUrl,
    setTranslationServerUrl,
  } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const [languageSearch, setLanguageSearch] = useState("");
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [translationServerDraft, setTranslationServerDraft] = useState(translationServerUrl);

  const handleLanguageSelect = async (selectedLanguage: AppLanguage) => {
    setLanguageDropdownOpen(false);
    setLanguageSearch("");
    await setLanguage(selectedLanguage);
  };
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
                  <Text style={styles.settingsEyebrow}>{t("settings.eyebrow")}</Text>
                  <Text style={styles.settingsTitle}>{t("settings.title")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.settingsCloseButton}
                  hitSlop={10}
                  onPress={() => setSettingsVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.closeSettings")}
                >
                  <Text style={styles.settingsCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>{t("settings.language.section")}</Text>
              <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 8 }]}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🌐</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingDescription}>
                    {t("settings.language.description")}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  settingsLanguageStyles.controlsContainer,
                  languageDropdownOpen && settingsLanguageStyles.rowOpen,
                ]}
              >
                <LanguageSelector
                  language={language}
                  onSelect={handleLanguageSelect}
                  search={languageSearch}
                  onSearchChange={setLanguageSearch}
                  open={languageDropdownOpen}
                  onOpen={() => {
                    setLanguageDropdownOpen(true);
                  }}
                  onClose={() => setLanguageDropdownOpen(false)}
                  noResultsText={t("settings.language.noTranslatedLanguage")}
                  placeholder={t("settings.language.searchLanguageName")}
                  label={t("settings.language.name")}
                  showLabel={false}
                  languages={languages}
                  loading={languageLoading}
                />
                <Text style={styles.settingDescription}>
                  {t("settings.language.serverUrlDescription")}
                </Text>
                <View style={styles.inputClearWrapper}>
                  <TextInput
                    value={translationServerDraft}
                    onChangeText={setTranslationServerDraft}
                    placeholder={t("settings.language.serverUrlPlaceholder")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    style={[styles.input, styles.inputWithClearSpace]}
                    accessibilityLabel={t("settings.language.serverUrl")}
                  />
                  {translationServerDraft.length > 0 ? (
                    <TouchableOpacity
                      style={styles.clearInputButton}
                      onPress={() => setTranslationServerDraft("")}
                      activeOpacity={BUTTON_ACTIVE_OPACITY}
                      accessibilityRole="button"
                      accessibilityLabel={t("accounts.clearSearch")}
                      hitSlop={6}
                    >
                      <Text style={styles.clearInputButtonText}>×</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => void setTranslationServerUrl(translationServerDraft)}
                  disabled={languageLoading || translationLoading || !translationServerDraft.trim()}
                  activeOpacity={BUTTON_ACTIVE_OPACITY}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("settings.language.saveServerUrl")}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>{t("settings.experience.section")}</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>📳</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>{t("settings.haptics.title")}</Text>
                  <Text style={styles.settingDescription}>{t("settings.haptics.description")}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingSwitch, hapticsEnabled && styles.settingSwitchOn]}
                  onPress={() => void toggleHaptics()}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticsEnabled }}
                  accessibilityLabel={t("settings.haptics.title")}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      hapticsEnabled && styles.settingSwitchThumbOn,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>{t("settings.security.section")}</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🔐</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>{t("settings.deviceLock.title")}</Text>
                  <Text style={styles.settingDescription}>
                    {biometricEnabled
                      ? t("settings.deviceLock.description")
                      : t("settings.deviceLock.requirement")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.settingSwitch, biometricEnabled && styles.settingSwitchOn]}
                  onPress={() => void toggleBiometricLock()}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: biometricEnabled }}
                  accessibilityLabel={t("settings.deviceLock.accessibilityLabel")}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      biometricEnabled && styles.settingSwitchThumbOn,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionLabel}>{t("settings.backup.section")}</Text>
              <View style={styles.backupButtonsRow}>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("export")}
                  activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
                >
                  <Text style={styles.backupActionIcon}>⬆</Text>
                  <Text style={styles.backupActionTitle}>{t("backupRestore.createBackup")}</Text>
                  <Text style={styles.backupActionDescription}>
                    {t("backupRestore.encryptedFile")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("restore")}
                  activeOpacity={BUTTON_ACTIVE_OPACITY_SOFT}
                >
                  <Text style={styles.backupActionIcon}>⬇</Text>
                  <Text style={styles.backupActionTitle}>{t("backupRestore.restoreBackup")}</Text>
                  <Text style={styles.backupActionDescription}>
                    {t("backupRestore.importFile")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.backupSafetyText}>{t("backupRestore.safetyNote")}</Text>

              <Text style={styles.settingsSectionLabel}>{t("settings.danger.section")}</Text>
              <TouchableOpacity
                style={[styles.settingRow, inlineStyles.clearAllRow]}
                onPress={clearAllAccounts}
                accessibilityRole="button"
                accessibilityLabel={t("settings.danger.clearAccountsAccessibilityLabel")}
              >
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>🗑️</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={[styles.settingTitleText, inlineStyles.clearAllTitle]}>
                    {t("settings.danger.clearAccounts")}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t("settings.danger.clearAccountsDescription")}
                  </Text>
                </View>
                <Text style={inlineStyles.clearAllChevron}>›</Text>
              </TouchableOpacity>

              <Text style={styles.settingsSectionLabel}>{t("settings.appearance.section")}</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Text style={styles.settingIcon}>☀️</Text>
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitleText}>{t("settings.appearance.title")}</Text>
                  <Text style={styles.settingDescription}>
                    {t("settings.appearance.description")}
                  </Text>
                </View>
                <View style={styles.appearanceBadge}>
                  <Text style={styles.appearanceBadgeText}>{t("accounts.active")}</Text>
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
                  <Text style={styles.settingTitleText}>{t("settings.privacy.title")}</Text>
                  <Text style={styles.settingDescription}>{t("settings.privacy.description")}</Text>
                </View>
                <Text style={inlineStyles.legalChevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.settingsPrivacyNote}>
                <Text style={styles.settingsPrivacyIcon}>🛡️</Text>
                <Text style={styles.settingsPrivacyText}>{t("settings.privacy.storageNote")}</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsDoneButton}
                onPress={() => setSettingsVisible(false)}
                activeOpacity={BUTTON_ACTIVE_OPACITY_STRONG}
              >
                <Text style={styles.settingsDoneText}>{t("common.doneButton")}</Text>
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
            behavior={isIOS ? "padding" : "height"}
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
                    <Text style={styles.settingsEyebrow}>{t("backupRestore.secureVault")}</Text>
                    <Text style={styles.settingsTitle}>
                      {backupMode === "export"
                        ? t("backupRestore.createBackup")
                        : t("backupRestore.restoreBackup")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingsCloseButton}
                    hitSlop={10}
                    onPress={() => {
                      setBackupVisible(false);
                      setBackupPassword("");
                    }}
                    accessibilityLabel={t("backupRestore.closeBackup")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.settingsCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.backupModalDescription}>
                  {getBackupModalDescription(backupMode, accounts.length, t)}
                </Text>
                <Text style={styles.inputLabel}>{t("backupRestore.backupPassword")}</Text>
                {backupMode === "export" ? (
                  <View>
                    <View style={styles.backupPasswordCard}>
                      <Text selectable style={styles.backupPasswordText}>
                        {backupPassword || t("backupRestore.generatingSecurePassword")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cancelButton, styles.backupCopyButton]}
                      disabled={!backupPassword || backupBusy}
                      onPress={() => {
                        void clipboard
                          .setText(backupPassword)
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
                      accessibilityLabel={t("backupRestore.copyGeneratedBackup")}
                    >
                      <Text style={[styles.cancelButtonText, styles.backupCopyButtonText]}>
                        {t("backupRestore.copyPassword")}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.backupSafetyText}>
                      {t("backupRestore.passwordSafety")}
                      {t("backupRestore.backupFilePassword")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputClearWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithClearSpace]}
                      value={backupPassword}
                      onChangeText={setBackupPassword}
                      placeholder={t("backupRestore.enterBackupPassword")}
                      placeholderTextColor={COLORS.placeholder}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      accessibilityLabel={t("backupRestore.backupPassword2")}
                    />
                    {backupPassword.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearInputButton}
                        onPress={() => setBackupPassword("")}
                        activeOpacity={BUTTON_ACTIVE_OPACITY}
                        accessibilityRole="button"
                        accessibilityLabel={t("backupRestore.clearBackupPassword")}
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
                      ? t("activity.wait")
                      : backupMode === "export"
                        ? t("backupRestore.encryptShareBackup")
                        : t("backupRestore.importAction")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setBackupVisible(false);
                    setBackupPassword("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>{t("messages.account.cancelButton")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

export default memo(SettingsBackupActivityModals);
