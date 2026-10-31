/** Centralized user-facing messages used by hooks and UI actions. */
import { getCurrentLanguage, translate } from "../i18n";

const localize = (key: string, values?: Record<string, string | number>) =>
  translate(getCurrentLanguage(), key, values);

const userMessages = {
  haptics: {
    saveFailedTitle: "Could not save setting",
    saveFailedBody: "Haptic feedback preference could not be saved. Please try again.",
  },
  legalAcceptance: {
    saveFailedTitle: "Could not save acknowledgment",
    saveFailedBody: "Please try again. You must accept the legal notice before using KaalKey.",
  },
  cameraPermission: {
    title: "Camera permission required",
    body: "Allow camera access to scan an authenticator setup QR code.",
  },
  qr: {
    unsupportedTitle: "Unsupported QR code",
    unsupportedBody:
      "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.",
    unsupportedDiagnostic: "That QR is not a TOTP setup code. Aim at an authenticator setup QR.",
    detectedDiagnostic: "QR detected. Analyzing…",
    startingCamera: "Starting camera…",
    analyzing: "Analyzing QR code…",
    duplicateTitle: "Account already added",
    duplicateBody: (issuer: string, account: string) =>
      `${issuer}: ${account} is already in KaalKey.`,
    addedTitle: "Account added",
    addedBody: (issuer: string, account: string) => `${issuer}: ${account} was added successfully.`,
    saveFailedDiagnostic: "Could not save the account. You can scan again.",
    invalidTitle: "Invalid QR code",
    invalidBody: (detail: string, prefix: string) =>
      `KaalKey could not parse this authenticator QR code. ${detail}. Use the service's TOTP setup QR code (usually starts with ${prefix}).`,
    parseFailedDiagnostic: "QR could not be processed. Aim at the setup QR and try again.",
    invalidUrlTitle: "Invalid TOTP URL",
    invalidUrlBody: (prefix: string) =>
      `Paste a complete authenticator URL beginning with ${prefix}.`,
    clipboardEmptyTitle: "Clipboard is empty",
    clipboardEmptyBody: (prefix: string) => `Copy an ${prefix} URL first, then tap Paste TOTP URL.`,
    clipboardErrorTitle: "Could not read clipboard",
    clipboardErrorBody: "Copy the TOTP setup URL and try again.",
  },
  storage: {
    browserUnavailable: "Browser storage is unavailable.",
    browserFilePickerUnavailable: "The browser file picker is unavailable.",
  },
  qrImport: {
    unsupportedFileTitle: "Unsupported file",
    unsupportedFileBody: "Choose a QR code image such as PNG or JPEG.",
    browserDecoderUnavailable: "Browser image decoding is unavailable",
    imageLoadFailed: "Image could not be loaded",
    unreadableDimensions: "Image has no readable dimensions",
    noQrCodeFoundTitle: "No QR code found",
    noQrCodeFoundBody:
      "KaalKey could not decode a QR code in this image. Try a screenshot or a higher-resolution PNG/JPEG.",
    couldNotReadImageTitle: "Could not read image",
    couldNotReadImageBody:
      "Try a clear PNG or JPEG image containing the authenticator setup QR code.",
    couldNotOpenPickerTitle: "Could not open image picker",
    couldNotOpenPickerBody: "Please try Upload QR again.",
    normalizedDecodeFailed: "Normalized image could not be decoded",
    clipboardImageLoadFailed: "Clipboard image could not be loaded",
    imageProcessingUnavailable: "Image processing is unavailable",
    imageProcessingUnavailableAlt: "Image processing unavailable",
    noImageInClipboardTitle: "No image in clipboard",
    noImageInClipboardBody: "Copy a QR code image, then tap Paste QR Image again.",
    clipboardUnavailableTitle: "Clipboard unavailable",
    clipboardUnavailableBody:
      "Clipboard text is not a valid authenticator setup URL. Copy an otpauth:// URL or QR image and try again.",
    clipboardAccessBody:
      "KaalKey could not read text or an image from the clipboard. Allow clipboard access, then copy the QR image or otpauth:// URL and tap Paste QR Image / URL again.",
    couldNotPasteImageTitle: "Could not paste image",
    couldNotPasteImageBody:
      "Image pasting is not supported by this clipboard on this device. Use Import QR image instead.",
    sourceImageDecodeFailure: "Try a different QR image.",
    sourceImageReadFailure: "Try copying a clear QR screenshot.",
    importFailedTitle: "QR image import failed",
    importFailedBody: "KaalKey could not read that image. Please try another QR code image.",
    notFoundBody: "The copied image does not contain a readable QR code.",
    pastedNotFoundBody: "The pasted image does not contain a readable QR code.",
    pastedReadFailureBody: "Try copying a clear PNG or JPEG image containing the full QR code.",
    pastedImportFailureBody: "Try a different QR image.",
    noQrCodeTextBody:
      "KaalKey decoded the selected image but did not find a QR code. Try a clear, full-resolution PNG or JPEG with the entire code visible.",
  },
  totpImport: {
    invalidTotpCode: "This QR code is not a time-based authenticator setup code.",
    missingAccountDetails: "The QR code is missing account details.",
    unsupportedAlgorithm: "The QR code uses an unsupported algorithm.",
    unsupportedDigits: "This QR code must use 6, 7, or 8 digits.",
    unsupportedPeriod: "This QR code uses an unsupported time period.",
    invalidAccount: "The QR code could not be validated.",
  },
  account: {
    storageInvalidTitle: "Storage data invalid",
    storageInvalidBody: "Saved account data could not be read safely.",
    storageErrorTitle: "Storage error",
    storageErrorBody: "Saved accounts could not be loaded.",
    missingTitle: "Missing information",
    missingEditingBody: "Enter the service name and account name.",
    missingBody: "Enter the service name, account name, and secret key.",
    invalidOtpBody: (digits: string, minPeriod: number, maxPeriod: number) =>
      `Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be ${digits} and the period must be ${minPeriod}–${maxPeriod} seconds.`,
    duplicateBody: "An account with this service and account name is already saved.",
    updatedBody: "Your account was updated.",
    addedBody: "Your account was added securely.",
    invalidOtpTitle: "Invalid OTP settings",
    duplicateTitle: "Account already exists",
    savedTitle: "Account saved",
    invalidSecretTitle: "Invalid secret key",
    invalidSecretBody: "Please check that you entered a valid Base32 secret.",
    removedTitle: "Account removed",
    removedBody: "The account and its secret were removed from this device.",
    clearedTitle: "Accounts cleared",
    clearedBody: "All authenticator accounts and secrets were removed from this device.",
    someSavedAccountsNeedAttentionTitle: "Some saved accounts need attention",
    someSavedAccountsNeedAttentionBody: (count: number) =>
      `${count} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.`,
    removeConfirmTitle: "Remove account?",
    removeConfirmWebTitle: "Remove account?",
    cancelButton: "Cancel",
    removeButton: "Remove",
    clearButton: "Clear all",
    clearConfirmTitle: "Clear all accounts?",
    saveErrorBody: "Accounts could not be saved. Check browser storage availability and try again.",
    notFoundTitle: "Account not found",
    notFoundBody: "This account could not be found. Close the editor and try again.",
    removeConfirmBody: "This removes the account and its secret from this device.",
    clearConfirmBody:
      "This permanently removes all authenticator accounts and their secrets from this device. Create an encrypted backup first if you may need these accounts later.",
    clearConfirmUndoBody: "This cannot be undone.",
  },
  backup: {
    invalidJson: "The backup file is not valid JSON.",
    unsupportedFormat: "This is not a supported KaalKey encrypted backup.",
    invalidPasswordOrDamaged: "Backup password is incorrect or the backup file is damaged.",
    invalidContents: "The backup contents are invalid or incomplete.",
    secureRandomUnavailableDetailed:
      "Secure random generation is unavailable. Rebuild and reinstall the Android app with expo-crypto included, then try again.",
    invalidAccountDataForBackup:
      "One or more accounts are invalid. Fix the account data before creating a backup.",
    invalidPasswordOrModified: "Backup password is incorrect or the backup file has been modified.",
    invalidPasswordOrFileDamaged: "Backup password is incorrect or the file is damaged.",
    passwordCopiedTitle: "Password copied",
    enterPasswordTitle: "Enter your backup password",
    enterPasswordBody: "Enter the password used when this backup was created.",
    passwordCopiedBody: "Save it somewhere safe, such as WhatsApp.",
    copyFailedTitle: "Copy failed",
    copyFailedBody: "Select and copy the password manually.",
    generatingPassword: "Generating secure backup password…",
    encrypting: "Encrypting backup…",
    decrypting: "Decrypting backup…",
    restoring: "Restoring accounts…",
    backupCreatedTitle: "Backup created",
    restoreCompleteTitle: "Restore complete",
    mergeConfirmTitle: "Merge backup accounts?",
    mergeConfirmButton: "Merge accounts",
    backupSavedTemporary: (uri: string) => `Encrypted backup saved temporarily at:\n${uri}`,
    generatePasswordErrorTitle: "Could not generate backup password",
    secureRandomUnavailable: "Secure random generation is unavailable.",
    passwordUnavailableTitle: "Backup password unavailable",
    passwordUnavailableBody:
      "Close this dialog and create a new backup to generate a secure password.",
    backupDownloadedBody:
      "Your encrypted KaalKey backup has been downloaded. Keep the file and password private.",
    backupFailedTitle: "Backup failed",
    backupCreateErrorBody: "KaalKey could not create the backup.",
    restoreFailedTitle: "Restore failed",
    backupReadErrorBody: "The backup could not be read or saved.",
    browserDownloadUnsupported: "Your browser does not support downloading backup files.",
    localFileUnavailable: "A local file location is unavailable on this device.",
    saveBackupTitle: "Save your encrypted KaalKey backup",
  },
  clipboard: {
    copiedTitle: "Code copied",
    copiedBody: "Your verification code has been copied.",
    errorTitle: "Error",
    errorBody: "Could not copy the verification code.",
  },
  activity: {
    cameraReady: "Camera ready. Point it at the authenticator QR code.",
    readingQrImage: "Reading QR image…",
    importingQrImage: "Importing QR image…",
    importingAccount: "Importing authenticator account…",
    importingPastedImage: "Importing pasted QR image…",
  },
  biometric: {
    unlockPrompt: "Unlock KaalKey Authenticator",
    promptSubtitle: "Use biometrics or your device screen lock",
    cancelButton: "Cancel",
    disableConfirmPrompt: "Confirm to turn off KaalKey app lock",
    enablePrompt: "Enable app lock for KaalKey",
    deviceLockTitle: "Set up your device screen lock",
    deviceLockBody:
      "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional.",
    unavailableTitle: "Device authentication unavailable",
    unavailableBody:
      "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again.",
    lockedTitle: "Authentication temporarily locked",
    lockedBody:
      "Your phone has temporarily disabled authentication after too many attempts. Wait and try again.",
    promptErrorTitle: "Authentication unavailable",
    promptErrorBody:
      "KaalKey could not start the phone's secure authentication prompt. Please try again.",
    webLock:
      "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.",
    disabledTitle: "App lock disabled",
    disabledBody: "KaalKey app lock has been turned off.",
    saveErrorTitle: "Could not save setting",
    disableSaveError: "The app lock remains enabled. Please try again.",
    enabledTitle: "App lock enabled",
    enabledBody:
      "KaalKey will request your phone's built-in authentication when opened and when you return to it.",
    enableSaveError: "App lock could not be enabled. Please try again.",
  },
} as const;

const getFunctionTemplate = (value: (...args: unknown[]) => string) => {
  const source = value.toString();
  const templateMatch = source.match(/=>\s*`([\s\S]*?)`/);
  if (!templateMatch) return null;
  return templateMatch[1]
    .replace(/\\n/g, "\n")
    .replace(/\$\{([^}]+)\}/g, (_, expr: string) => `{${expr.trim()}}`);
};

const getFunctionValues = (value: (...args: unknown[]) => string, args: unknown[]) => {
  const source = value.toString();
  const paramsMatch = source.match(/\(([^)]*)\)/);
  if (!paramsMatch) return {} as Record<string, string | number>;

  const entries = paramsMatch[1]
    .split(",")
    .map((param) => param.trim())
    .filter(Boolean)
    .map((name, index) => [name, args[index]] as const);

  return Object.fromEntries(entries) as Record<string, string | number>;
};

const localizeUserMessages = (messages: typeof userMessages) => {
  const walk = <T>(value: T, path: string[]): T => {
    const key = `messages.${path.join(".")}`;
    if (typeof value === "function") {
      return ((...args: unknown[]) => {
        const template = getFunctionTemplate(value as (...args: unknown[]) => string);
        if (!template) return localize(key);

        const values = getFunctionValues(value as (...args: unknown[]) => string, args);
        return localize(key, values);
      }) as unknown as T;
    }
    if (value && typeof value === "object") {
      return new Proxy(value, {
        get(target, property, receiver) {
          return walk(Reflect.get(target, property, receiver), [...path, String(property)]);
        },
      });
    }
    return (typeof value === "string" ? localize(key) : value) as T;
  };

  return walk(messages, []);
};

export const USER_MESSAGES = localizeUserMessages(userMessages);
