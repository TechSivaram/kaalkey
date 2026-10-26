import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  BackHandler,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as OTPAuth from "otpauth";
import jsQR from "jsqr";
import jpeg from "jpeg-js";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Account } from "../types/account";
import { encryptBackup, decryptBackup } from "../services/backup";
import { generateCode } from "../services/otp";
import { normalizeBase32Secret, validateAccount } from "../services/account-validation";
import CountdownRing from "../components/CountdownRing";
import { styles } from "../styles/home.styles";
import WebQrScanner from "../components/WebQrScanner";

const STORAGE_KEY = "kaalkey_accounts_v1";
const BIOMETRIC_ENABLED_KEY = "kaalkey_biometric_lock_enabled_v1";
const HAPTICS_ENABLED_KEY = "kaalkey_haptics_enabled_v1";
const LEGAL_ACCEPTANCE_KEY = "kaalkey_legal_acceptance_v1";
const LEGAL_VERSION = "1.0";

let hapticsAreEnabled = true;

// Account records use SecureStore on native and origin-scoped localStorage on web.
// Keep this helper limited to account data so native storage behavior stays unchanged.
async function readAccountsStorage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function writeAccountsStorage(value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") throw new Error("Browser storage is unavailable.");
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

function showBackupMessage(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
const legalHeadingStyle = {
  fontSize: 14,
  lineHeight: 20,
  fontWeight: "800" as const,
  color: "#172A46",
  marginTop: 13,
  marginBottom: 4,
};
const legalBodyStyle = { fontSize: 13, lineHeight: 20, color: "#45556D" };

// Optional haptic feedback; failures never interrupt account actions.
function hapticFeedback(kind: "selection" | "success" | "warning" = "selection") {
  if (!hapticsAreEnabled) return;
  try {
    if (Platform.OS === "android") {
      const pattern =
        kind === "success" ? [0, 22, 45, 28] : kind === "warning" ? [0, 38, 55, 38] : 12;
      Vibration.vibrate(pattern);
    } else if (Platform.OS === "ios") {
      Vibration.vibrate(kind === "success" ? 35 : kind === "warning" ? 45 : 15);
    }
  } catch {
    // Haptic feedback is optional.
  }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scannerCameraHeight = Math.min(300, Math.max(180, Math.round(windowHeight * 0.34)));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [backupMode, setBackupMode] = useState<"export" | "restore">("export");
  const [backupPassword, setBackupPassword] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [activityMessage, setActivityMessage] = useState<string | null>(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [legalLoaded, setLegalLoaded] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [legalReviewVisible, setLegalReviewVisible] = useState(false);
  const [legalDocument, setLegalDocument] = useState<"privacy" | "terms">("privacy");
  const [legalSaving, setLegalSaving] = useState(false);
  const authenticatingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"service" | "account">("service");
  const [issuer, setIssuer] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secret, setSecret] = useState("");
  const [totpUrlInput, setTotpUrlInput] = useState("");
  const [manualExpanded, setManualExpanded] = useState(false);
  const [qrAccount, setQrAccount] = useState<Account | null>(null);
  const [qrRevealed, setQrRevealed] = useState(false);
  const [otpAlgorithm, setOtpAlgorithm] = useState<Account["algorithm"]>("SHA1");
  const [otpDigits, setOtpDigits] = useState<number>(6);
  const [otpPeriod, setOtpPeriod] = useState<string>("30");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowBrandSplash(false), 5000);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const saved = await readAccountsStorage();

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            const validAccounts = parsed.filter(validateAccount);
            setAccounts(validAccounts);
            if (validAccounts.length !== parsed.length) {
              Alert.alert(
                "Some saved accounts need attention",
                `${parsed.length - validAccounts.length} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.`,
              );
            }
          } else {
            Alert.alert("Storage data invalid", "Saved account data could not be read safely.");
          }
        }
      } catch {
        Alert.alert("Storage error", "Saved accounts could not be loaded.");
      } finally {
        setLoaded(true);
      }
    }

    void loadAccounts();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadLegalAcceptance() {
      try {
        // expo-secure-store is native-only; use browser localStorage on web.
        const saved =
          Platform.OS === "web"
            ? typeof window !== "undefined"
              ? window.localStorage.getItem(LEGAL_ACCEPTANCE_KEY)
              : null
            : await SecureStore.getItemAsync(LEGAL_ACCEPTANCE_KEY);
        if (mounted) setLegalAccepted(saved === LEGAL_VERSION);
      } catch {
        // If the saved decision cannot be read, require acknowledgment again.
        if (mounted) setLegalAccepted(false);
      } finally {
        if (mounted) setLegalLoaded(true);
      }
    }
    void loadLegalAcceptance();
    return () => {
      mounted = false;
    };
  }, []);

  async function acceptLegalNotice() {
    if (!legalChecked || legalSaving) return;
    setLegalSaving(true);
    try {
      // Persist acceptance with a web-compatible store in browsers.
      if (Platform.OS === "web") {
        if (typeof window === "undefined") throw new Error("Browser storage is unavailable");
        window.localStorage.setItem(LEGAL_ACCEPTANCE_KEY, LEGAL_VERSION);
      } else {
        await SecureStore.setItemAsync(LEGAL_ACCEPTANCE_KEY, LEGAL_VERSION);
      }
      setLegalAccepted(true);
      setLegalReviewVisible(false);
      setLegalChecked(false);
    } catch {
      Alert.alert(
        "Could not save acknowledgment",
        "Please try again. You must accept the legal notice before using KaalKey.",
      );
    } finally {
      setLegalSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function loadHapticPreference() {
      try {
        const saved = await SecureStore.getItemAsync(HAPTICS_ENABLED_KEY);
        const enabled = saved !== "false";
        if (mounted) setHapticsEnabled(enabled);
        hapticsAreEnabled = enabled;
      } catch {
        hapticsAreEnabled = true;
      }
    }
    void loadHapticPreference();
    return () => {
      mounted = false;
    };
  }, []);

  async function toggleHaptics() {
    const next = !hapticsEnabled;
    try {
      await SecureStore.setItemAsync(HAPTICS_ENABLED_KEY, String(next));
      hapticsAreEnabled = next;
      setHapticsEnabled(next);
      if (next) hapticFeedback("success");
    } catch {
      Alert.alert(
        "Could not save setting",
        "Haptic feedback preference could not be saved. Please try again.",
      );
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadBiometricPreference() {
      try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        if (!mounted) return;
        // Native device authentication is not available through this web build.
        // Keep the web vault unlocked by default rather than showing a dead-end prompt.
        // Native platforms continue to respect the user's saved switch preference.
        const shouldEnable = Platform.OS !== "web" && enabled === "true";
        setBiometricEnabled(shouldEnable);
        setIsUnlocked(!shouldEnable);
      } catch {
        if (mounted) {
          if (Platform.OS === "web") {
            // Web has no native authentication flow, so it must not get trapped behind
            // an authentication prompt that cannot run.
            setBiometricEnabled(false);
            setIsUnlocked(true);
          } else {
            // On native platforms, fail closed if a previously saved lock preference
            // cannot be read; never silently bypass an existing lock.
            setBiometricEnabled(true);
            setIsUnlocked(false);
          }
        }
      } finally {
        if (mounted) setBiometricReady(true);
      }
    }

    void loadBiometricPreference();
    return () => {
      mounted = false;
    };
  }, []);

  async function authenticateUser(
    promptMessage = "Unlock KaalKey Authenticator",
    unlockOnSuccess = true,
  ): Promise<boolean> {
    if (authenticatingRef.current) return false;
    authenticatingRef.current = true;
    setAuthenticating(true);
    try {
      // Use Android's native BiometricPrompt with device-credential fallback enabled.
      // This allows biometrics when available and the OS screen-lock credential (PIN,
      // pattern, or password) when supported. Never unlock unless the native API succeeds.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        promptSubtitle: "Use biometrics or your device screen lock",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        biometricsSecurityLevel: "strong",
      });
      if (result.success) {
        if (unlockOnSuccess) setIsUnlocked(true);
        return true;
      }

      // A missing device screen lock must not create a fallback or bypass.
      if (result.error === "not_enrolled" || result.error === "passcode_not_set") {
        Alert.alert(
          "Set up your device screen lock",
          "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional.",
        );
      } else if (result.error === "not_available") {
        Alert.alert(
          "Device authentication unavailable",
          "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again.",
        );
      } else if (result.error === "lockout") {
        Alert.alert(
          "Authentication temporarily locked",
          "Your phone has temporarily disabled authentication after too many attempts. Wait and try again.",
        );
      }
      // Cancellation, failed verification, and every other error leave the vault locked.
      return false;
    } catch {
      Alert.alert(
        "Authentication unavailable",
        "KaalKey could not start the phone's secure authentication prompt. Please try again.",
      );
      return false;
    } finally {
      authenticatingRef.current = false;
      setAuthenticating(false);
    }
  }

  async function toggleBiometricLock() {
    // Do not expose a non-working native-auth switch on web. The web build currently
    // has no implemented browser-authentication flow, so keep its app-level lock OFF.
    if (Platform.OS === "web") {
      const message =
        "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.";
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(message);
      } else {
        Alert.alert("Authentication unavailable", message);
      }
      setBiometricEnabled(false);
      setIsUnlocked(true);
      return;
    }

    if (biometricEnabled) {
      // Do not unlock as a side effect of confirming the setting change. Only disable
      // the lock after authentication succeeds and the preference is persisted.
      const authenticated = await authenticateUser("Confirm to turn off KaalKey app lock", false);
      if (!authenticated) return;
      try {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false");
        setBiometricEnabled(false);
        setIsUnlocked(true);
        Alert.alert("App lock disabled", "KaalKey app lock has been turned off.");
      } catch {
        setIsUnlocked(false);
        Alert.alert("Could not save setting", "The app lock remains enabled. Please try again.");
      }
      return;
    }

    // Biometrics are not required to enable app lock. The native OS prompt can use
    // the configured device credential when biometrics are unavailable.
    const authenticated = await authenticateUser("Enable app lock for KaalKey", false);
    if (!authenticated) return;
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setBiometricEnabled(true);
      setIsUnlocked(true);
      Alert.alert(
        "App lock enabled",
        "KaalKey will request your phone's built-in authentication when opened and when you return to it.",
      );
    } catch {
      Alert.alert("Could not save setting", "App lock could not be enabled. Please try again.");
    }
  }

  useEffect(() => {
    if (!biometricReady || !biometricEnabled || isUnlocked) return;

    // Defer the native authentication prompt until after the effect has committed.
    // This avoids synchronously triggering React state updates inside the effect.
    const promptTimer = setTimeout(() => {
      void authenticateUser();
    }, 0);

    return () => clearTimeout(promptTimer);
    // Prompt once when the saved lock setting requires authentication.
  }, [biometricReady, biometricEnabled, isUnlocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded = /inactive|background/.test(appStateRef.current ?? "");
      appStateRef.current = nextState;
      if (biometricEnabled && nextState === "active" && wasBackgrounded) {
        setIsUnlocked(false);
        void authenticateUser();
      } else if (biometricEnabled && /inactive|background/.test(nextState)) {
        setIsUnlocked(false);
      }
    });
    return () => subscription.remove();
  }, [biometricEnabled]);

  // While locked, Android Back must never uncover the underlying vault.
  useEffect(() => {
    if (!biometricReady || !biometricEnabled || isUnlocked) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [biometricReady, biometricEnabled, isUnlocked]);

  async function saveAccounts(updated: Account[]): Promise<boolean> {
    try {
      await writeAccountsStorage(JSON.stringify(updated));

      setAccounts(updated);
      return true;
    } catch {
      showBackupMessage(
        "Storage error",
        "Accounts could not be saved. Check browser storage availability and try again.",
      );
      return false;
    }
  }

  function openAddAccount() {
    hapticFeedback("selection");
    setEditingId(null);
    setIssuer("");
    setAccountName("");
    setSecret("");
    setTotpUrlInput("");
    setManualExpanded(false);
    setOtpAlgorithm("SHA1");
    setOtpDigits(6);
    setOtpPeriod("30");
    setModalVisible(true);
  }

  function openEditAccount(account: Account) {
    hapticFeedback("selection");
    setEditingId(account.id);
    setIssuer(account.issuer);
    setAccountName(account.name);
    setSecret(account.secret);
    setOtpAlgorithm(account.algorithm);
    setOtpDigits(account.digits);
    setOtpPeriod(String(account.period));
    setModalVisible(true);
  }

  function openAccountQr(account: Account) {
    hapticFeedback("selection");
    setQrAccount(account);
    setQrRevealed(false);
  }

  function closeAccountQr() {
    setQrRevealed(false);
    setQrAccount(null);
  }

  function createAccountOtpAuthUrl(account: Account): string {
    const label = `${encodeURIComponent(account.issuer)}:${encodeURIComponent(account.name)}`;
    const params = new URLSearchParams({
      secret: account.secret,
      issuer: account.issuer,
      algorithm: account.algorithm,
      digits: String(account.digits),
      period: String(account.period),
    });
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  async function saveAccount() {
    const originalAccount = editingId
      ? accounts.find((account) => account.id === editingId)
      : undefined;
    const normalizedSecret = editingId
      ? (originalAccount?.secret ?? "")
      : normalizeBase32Secret(secret);
    const normalizedIssuer = issuer.trim();
    const normalizedName = accountName.trim();

    if (!normalizedIssuer || !normalizedName || !normalizedSecret) {
      showBackupMessage(
        "Missing information",
        editingId
          ? "Enter the service name and account name."
          : "Enter the service name, account name, and secret key.",
      );
      return;
    }
    if (editingId && !originalAccount) {
      showBackupMessage(
        "Account not found",
        "This account could not be found. Close the editor and try again.",
      );
      return;
    }

    // Editing is intentionally limited to issuer/service and account name.
    // Always preserve the original secret and OTP configuration from storage.
    const candidate: Account = {
      id: editingId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      issuer: normalizedIssuer,
      name: normalizedName,
      secret: normalizedSecret,
      algorithm: originalAccount?.algorithm ?? otpAlgorithm,
      digits: originalAccount?.digits ?? otpDigits,
      period: originalAccount?.period ?? Number(otpPeriod),
    };

    if (!validateAccount(candidate)) {
      showBackupMessage(
        "Invalid OTP settings",
        "Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be 6–8 and the period must be 1–120 seconds.",
      );
      return;
    }

    try {
      const duplicate = accounts.some(
        (existing) =>
          existing.id !== editingId &&
          existing.issuer.toLowerCase() === normalizedIssuer.toLowerCase() &&
          existing.name.toLowerCase() === normalizedName.toLowerCase(),
      );

      if (duplicate) {
        showBackupMessage(
          "Account already exists",
          "An account with this service and account name is already saved.",
        );
        return;
      }

      const updated: Account[] = editingId
        ? accounts.map((existing) => (existing.id === editingId ? candidate : existing))
        : [...accounts, candidate];

      const saved = await saveAccounts(updated);
      if (saved) {
        hapticFeedback("success");
        setIssuer("");
        setAccountName("");
        setSecret("");
        setOtpAlgorithm("SHA1");
        setOtpDigits(6);
        setOtpPeriod("30");
        setEditingId(null);
        setModalVisible(false);
        showBackupMessage(
          "Account saved",
          editingId ? "Your account was updated." : "Your account was added securely.",
        );
      }
    } catch {
      showBackupMessage(
        "Invalid secret key",
        "Please check that you entered a valid Base32 secret.",
      );
    }
  }

  function decodeBase64ToBytes(base64: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const clean = base64.replace(/[^A-Za-z0-9+/=]/g, "");
    const output = new Uint8Array(
      Math.floor((clean.length * 3) / 4) - (clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0),
    );
    let outIndex = 0;
    for (let i = 0; i < clean.length; i += 4) {
      const a = alphabet.indexOf(clean[i] || "A");
      const b = alphabet.indexOf(clean[i + 1] || "A");
      const c = alphabet.indexOf(clean[i + 2] || "A");
      const d = alphabet.indexOf(clean[i + 3] || "A");
      const chunk = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
      if (outIndex < output.length) output[outIndex++] = (chunk >> 16) & 255;
      if (outIndex < output.length) output[outIndex++] = (chunk >> 8) & 255;
      if (outIndex < output.length) output[outIndex++] = chunk & 255;
    }
    return output;
  }

  function showQrImportMessage(title: string, message: string) {
    // React Native Alert is not consistently rendered on web. Use the browser
    // dialog there so failures never appear to do nothing.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  }

  async function importQrImage() {
    try {
      if (Platform.OS === "web") {
        // Use the browser's native file picker; no image is uploaded anywhere.
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
        // Keep the picker attached to the DOM. Some browsers silently ignore
        // click() on a detached file input, which looked like upload did nothing.
        input.style.position = "fixed";
        input.style.left = "-10000px";
        input.style.width = "1px";
        input.style.height = "1px";
        document.body.appendChild(input);
        input.oncancel = () => {
          input.remove();
        };
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            input.remove();
            return;
          }
          if (!file.type.startsWith("image/")) {
            showQrImportMessage("Unsupported file", "Choose a QR code image such as PNG or JPEG.");
            return;
          }
          let objectUrl: string | undefined;
          setActivityMessage("Reading QR image…");
          try {
            // Decode via a canvas + jsQR so web import works in browsers that do
            // not implement the experimental BarcodeDetector API.
            objectUrl = URL.createObjectURL(file);
            // React Native's `Image` import shadows the browser constructor on web.
            // Resolve the native browser image explicitly so the canvas decoder receives
            // a real HTMLImageElement.
            const BrowserImage = globalThis.Image;
            if (!BrowserImage) {
              throw new Error("Browser image decoding is unavailable");
            }
            const image = new BrowserImage();
            await new Promise<void>((resolve, reject) => {
              image.onload = () => {
                resolve();
              };
              image.onerror = () => {
                reject(new Error("Image could not be loaded"));
              };
              image.src = objectUrl!;
            });
            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            if (!sourceWidth || !sourceHeight) throw new Error("Image has no readable dimensions");

            // Try the browser-native QR decoder first where supported. It is an
            // optional fast path only; jsQR remains the fallback on all browsers.
            let qrText: string | undefined;
            const Detector = (
              globalThis as typeof globalThis & {
                BarcodeDetector?: new (options?: { formats?: string[] }) => {
                  detect(
                    source: HTMLImageElement | HTMLCanvasElement,
                  ): Promise<{ rawValue?: string }[]>;
                };
              }
            ).BarcodeDetector;
            if (Detector) {
              try {
                const detected = await new Detector({ formats: ["qr_code"] }).detect(image);
                qrText = detected.find((item) => item.rawValue)?.rawValue;
              } catch {
                // Some browsers expose BarcodeDetector but cannot decode this file.
              }
            }

            // QR codes embedded in screenshots are often small relative to the
            // full image. Try original, enlarged (for small QR modules), and
            // reduced (for very large screenshots) renderings.
            const scales = [1, sourceWidth < 1400 && sourceHeight < 1400 ? 2 : 0.5, 1.5, 3];
            for (const scale of scales) {
              if (qrText) break;
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(sourceWidth * scale));
              canvas.height = Math.max(1, Math.round(sourceHeight * scale));
              const context = canvas.getContext("2d", { willReadFrequently: true });
              if (!context) continue;
              context.imageSmoothingEnabled = scale < 1;
              context.drawImage(image, 0, 0, canvas.width, canvas.height);
              const decodeCanvas = (left: number, top: number, width: number, height: number) => {
                const pixels = context.getImageData(left, top, width, height);
                return jsQR(pixels.data, pixels.width, pixels.height, {
                  inversionAttempts: "attemptBoth",
                })?.data;
              };
              qrText = decodeCanvas(0, 0, canvas.width, canvas.height);
              if (qrText) break;
              // Try the center and four overlapping quadrants for screenshots where
              // the QR occupies only part of the image. Crops are read from the
              // already scaled canvas, so they remain local and avoid extra uploads.
              const cropWidth = Math.max(1, Math.round(canvas.width * 0.72));
              const cropHeight = Math.max(1, Math.round(canvas.height * 0.72));
              const positions = [
                [
                  Math.round((canvas.width - cropWidth) / 2),
                  Math.round((canvas.height - cropHeight) / 2),
                ],
                [0, 0],
                [canvas.width - cropWidth, 0],
                [0, canvas.height - cropHeight],
                [canvas.width - cropWidth, canvas.height - cropHeight],
              ];
              for (const [left, top] of positions) {
                qrText = decodeCanvas(Math.max(0, left), Math.max(0, top), cropWidth, cropHeight);
                if (qrText) break;
              }
            }
            if (!qrText) {
              showQrImportMessage(
                "No QR code found",
                "KaalKey could not decode a QR code in this image. Try a screenshot or a higher-resolution PNG/JPEG.",
              );
              return;
            }
            await handleQrScanned(qrText, false);
          } catch {
            showQrImportMessage(
              "Could not read image",
              "Try a clear PNG or JPEG image containing the authenticator setup QR code.",
            );
          } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            input.remove();
            setActivityMessage(null);
          }
        };
        // Must be called directly within the user's click gesture.
        try {
          input.click();
        } catch {
          input.remove();
          showQrImportMessage("Could not open image picker", "Please try Upload QR again.");
        }
        return;
      }

      // Use the native photo-library picker on Android/iOS. Expo Camera in this
      // SDK version does not expose scanFromURLAsync, so decode a normalized JPEG
      // locally with jpeg-js + jsQR instead of calling a removed API.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setActivityMessage("Importing QR image…");
      const imageUri = result.assets[0].uri;

      let normalizedUri: string | undefined;
      try {
        const normalized = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1800 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        normalizedUri = normalized.uri;
        const base64 = await FileSystem.readAsStringAsync(normalized.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const bytes = decodeBase64ToBytes(base64);
        const decodedImage = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
        if (!decodedImage.width || !decodedImage.height || !decodedImage.data?.length) {
          throw new Error("Normalized image could not be decoded");
        }

        // jsQR works directly on RGBA pixel data. Retry the full image at several
        // scales and on the center crop, which helps with small QR codes.
        let qrData: string | undefined;
        const attempts = [
          { data: decodedImage.data, width: decodedImage.width, height: decodedImage.height },
        ];
        const centerX = Math.floor(decodedImage.width * 0.1);
        const centerY = Math.floor(decodedImage.height * 0.1);
        const centerWidth = Math.max(1, decodedImage.width - centerX * 2);
        const centerHeight = Math.max(1, decodedImage.height - centerY * 2);
        if (centerWidth < decodedImage.width || centerHeight < decodedImage.height) {
          const crop = new Uint8ClampedArray(centerWidth * centerHeight * 4);
          for (let row = 0; row < centerHeight; row++) {
            const from = ((centerY + row) * decodedImage.width + centerX) * 4;
            crop.set(
              decodedImage.data.subarray(from, from + centerWidth * 4),
              row * centerWidth * 4,
            );
          }
          attempts.push({ data: new Uint8Array(crop), width: centerWidth, height: centerHeight });
        }
        for (const attempt of attempts) {
          const qr = jsQR(new Uint8ClampedArray(attempt.data), attempt.width, attempt.height, {
            inversionAttempts: "attemptBoth",
          });
          if (qr?.data) {
            qrData = qr.data;
            break;
          }
        }
        if (!qrData) {
          showQrImportMessage(
            "No QR code found",
            "KaalKey decoded the selected image but did not find a QR code. Try a clear, full-resolution PNG or JPEG with the entire code visible.",
          );
          return;
        }
        await handleQrScanned(qrData, false);
      } catch {
        showQrImportMessage(
          "Could not read image",
          "KaalKey could not decode this image. Try a PNG or JPEG screenshot with the full QR code visible.",
        );
      } finally {
        if (normalizedUri) {
          try {
            await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
          } catch {
            // Cache cleanup is best-effort.
          }
        }
      }
    } catch {
      showQrImportMessage(
        "QR image import failed",
        "KaalKey could not read that image. Please try another QR code image.",
      );
    } finally {
      if (Platform.OS !== "web") setActivityMessage(null);
    }
  }

  async function pasteTotpUrl() {
    try {
      const pasted = (await Clipboard.getStringAsync()).trim();
      if (!pasted) {
        showBackupMessage(
          "Clipboard is empty",
          "Copy an otpauth://totp/ URL first, then tap Paste TOTP URL.",
        );
        return;
      }
      setTotpUrlInput(pasted);
      await importTotpUrl(pasted);
    } catch {
      showBackupMessage("Could not read clipboard", "Copy the TOTP setup URL and try again.");
    }
  }

  async function importTotpUrl(value = totpUrlInput) {
    const payload = value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!/^otpauth:\/\/totp\//i.test(payload)) {
      showBackupMessage(
        "Invalid TOTP URL",
        "Paste a complete authenticator URL beginning with otpauth://totp/.",
      );
      return;
    }
    await handleQrScanned(payload, false);
  }

  async function pasteQrImage() {
    try {
      if (Platform.OS === "web") {
        showBackupMessage(
          "Paste a QR image",
          "Click this screen and press Ctrl+V (Windows/Linux) or ⌘+V (Mac) after copying a QR image.",
        );
        return;
      }
      const image = await Clipboard.getImageAsync({ format: "png" });
      if (!image?.data) {
        showBackupMessage(
          "No image in clipboard",
          "Copy a QR code image, then tap Paste QR Image again.",
        );
        return;
      }
      setActivityMessage("Importing pasted QR image…");
      const extension = "png"; // getImageAsync({ format: "png" }) returns PNG base64 data.
      const sourceUri = `${FileSystem.cacheDirectory}kaalkey-clipboard-${Date.now()}.${extension}`;
      let normalizedUri: string | undefined;
      try {
        await FileSystem.writeAsStringAsync(sourceUri, image.data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const normalized = await ImageManipulator.manipulateAsync(
          sourceUri,
          [{ resize: { width: 1800 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        normalizedUri = normalized.uri;
        const base64 = await FileSystem.readAsStringAsync(normalized.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const decodedImage = jpeg.decode(decodeBase64ToBytes(base64), {
          useTArray: true,
          formatAsRGBA: true,
        });
        const qr = jsQR(
          new Uint8ClampedArray(decodedImage.data),
          decodedImage.width,
          decodedImage.height,
          {
            inversionAttempts: "attemptBoth",
          },
        );
        if (!qr?.data) {
          showBackupMessage(
            "No QR code found",
            "The copied image does not contain a readable QR code.",
          );
          return;
        }
        await handleQrScanned(qr.data, false);
      } finally {
        try {
          await FileSystem.deleteAsync(sourceUri, { idempotent: true });
        } catch {}
        if (normalizedUri) {
          try {
            await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
          } catch {}
        }
        setActivityMessage(null);
      }
    } catch {
      setActivityMessage(null);
      showBackupMessage(
        "Could not paste image",
        "Image pasting is not supported by this clipboard on this device. Use Import QR image instead.",
      );
    }
  }

  // Keep the paste listener stable while updating the handler after each render.
  const handleQrScannedRef = useRef(handleQrScanned);
  useEffect(() => {
    handleQrScannedRef.current = handleQrScanned;
  });

  useEffect(() => {
    if (Platform.OS !== "web" || !modalVisible || editingId) return;
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        setActivityMessage("Importing pasted QR image…");
        const image = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) throw new Error("Image processing unavailable");
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(pixels.data, pixels.width, pixels.height, {
              inversionAttempts: "attemptBoth",
            });
            if (qr?.data) void handleQrScannedRef.current(qr.data, false);
            else
              showQrImportMessage(
                "No QR code found",
                "The pasted image does not contain a readable QR code.",
              );
          } catch {
            showQrImportMessage(
              "Could not read pasted image",
              "Try copying a clear PNG or JPEG image containing the full QR code.",
            );
          } finally {
            URL.revokeObjectURL(objectUrl);
            setActivityMessage(null);
          }
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          setActivityMessage(null);
          showQrImportMessage("Could not read pasted image", "Try a different QR image.");
        };
        image.src = objectUrl;
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [modalVisible, editingId]);

  async function openQrScanner() {
    if (Platform.OS === "web") {
      setScanned(false);
      setModalVisible(false);
      setScannerVisible(true);
      return;
    }
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();

      if (!permission.granted) {
        Alert.alert(
          "Camera permission required",
          "Allow camera access to scan an authenticator setup QR code.",
        );
        return;
      }
    }

    setScanned(false);
    setModalVisible(false);
    setScannerVisible(true);
  }

  async function handleQrScanned(data: string, fromCamera = true) {
    // Image decoders can include surrounding whitespace or invisible Unicode
    // characters that are not present in the live camera result. Normalize only
    // the outer payload/protocol; leave encoded labels and query values untouched.
    const qrPayload = data
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim()
      .replace(/^otpauth:\/\/totp\//i, "otpauth://totp/");

    // `scanned` only debounces repeated live-camera frames. Gallery imports must
    // still be allowed after the scanner has previously scanned a code.
    if (fromCamera) {
      if (scanned) return;
      setScanned(true);
    }
    setActivityMessage("Importing authenticator account…");

    try {
      if (!qrPayload.startsWith("otpauth://totp/")) {
        showQrImportMessage(
          "Unsupported QR code",
          "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.",
        );
        if (fromCamera) setScanned(false);
        return;
      }

      // Use OTPAuth's URI parser for both live-camera scans and image imports.
      // Hand-parsing with the platform URL implementation caused valid otpauth
      // URIs to be rejected on some Android/web runtimes.
      const parsedUri = OTPAuth.URI.parse(qrPayload);
      if (!(parsedUri instanceof OTPAuth.TOTP)) {
        throw new Error("This QR code is not a time-based authenticator setup code.");
      }
      const parsed = parsedUri;

      const normalizedName = parsed.label?.trim();
      const normalizedIssuer = parsed.issuer?.trim() || "Authenticator";
      const normalizedSecret = parsed.secret.base32;
      const algorithm = parsed.algorithm;

      if (!normalizedName || !normalizedSecret) {
        throw new Error("The QR code is missing account details.");
      }

      if (!["SHA1", "SHA256", "SHA512"].includes(algorithm)) {
        throw new Error("The QR code uses an unsupported algorithm.");
      }

      // Keep QR-import validation aligned with encrypted-backup validation.
      if (!Number.isInteger(parsed.digits) || parsed.digits < 6 || parsed.digits > 8) {
        throw new Error("This QR code must use 6, 7, or 8 digits.");
      }
      if (!Number.isInteger(parsed.period) || parsed.period < 1 || parsed.period > 120) {
        throw new Error("This QR code uses an unsupported time period.");
      }

      const account: Account = {
        id: Date.now().toString() + "-" + Math.random().toString(36).slice(2),
        issuer: normalizedIssuer,
        name: normalizedName,
        secret: normalizedSecret,
        algorithm: algorithm as Account["algorithm"],
        digits: parsed.digits,
        period: parsed.period,
      };

      // Validate the full account record, including its Base32 secret and TOTP settings.
      if (!validateAccount(account)) {
        throw new Error("The QR code could not be validated.");
      }

      const duplicate = accounts.some(
        (existing) =>
          existing.issuer.toLowerCase() === account.issuer.toLowerCase() &&
          existing.name.toLowerCase() === account.name.toLowerCase(),
      );

      if (duplicate) {
        setScannerVisible(false);
        showBackupMessage(
          "Account already added",
          `${account.issuer}: ${account.name} is already in KaalKey.`,
        );
        return;
      }

      const saved = await saveAccounts([...accounts, account]);

      if (saved) {
        hapticFeedback("success");
        setScannerVisible(false);
        showBackupMessage(
          "Account added",
          `${account.issuer}: ${account.name} was added successfully.`,
        );
      } else if (fromCamera) {
        setScanned(false);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown QR parsing error";
      showBackupMessage(
        "Invalid QR code",
        `KaalKey could not parse this authenticator QR code. ${detail}. Use the service's TOTP setup QR code (usually starts with otpauth://totp/).`,
      );
      if (fromCamera) setScanned(false);
    } finally {
      setActivityMessage(null);
    }
  }

  async function copyCode(code: string) {
    if (!/^\d{6,8}$/.test(code)) {
      return;
    }

    try {
      await Clipboard.setStringAsync(code);
      hapticFeedback("success");

      Alert.alert("Code copied", "Your verification code has been copied.");
    } catch {
      Alert.alert("Error", "Could not copy the verification code.");
    }
  }

  async function removeAccountConfirmed(id: string) {
    hapticFeedback("warning");
    const updated = accounts.filter((account) => account.id !== id);
    const saved = await saveAccounts(updated);
    if (saved) {
      showBackupMessage(
        "Account removed",
        "The account and its secret were removed from this device.",
      );
    }
  }

  function deleteAccount(id: string) {
    const message = "This removes the account and its secret from this device.";

    // React Native's Alert.alert button callbacks are not implemented consistently
    // on web. Use the browser's native confirmation dialog there instead.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`Remove account?\n\n${message}`)) {
        void removeAccountConfirmed(id);
      }
      return;
    }

    Alert.alert("Remove account?", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void removeAccountConfirmed(id);
        },
      },
    ]);
  }

  function openBackup(mode: "export" | "restore") {
    hapticFeedback("selection");
    setBackupMode(mode);
    setBackupPassword("");
    setBackupVisible(true);
  }

  async function exportEncryptedBackup() {
    if (backupPassword.length < 10) {
      showBackupMessage(
        "Use a stronger backup password",
        "Choose at least 10 characters. You will need this password to restore the backup.",
      );
      return;
    }
    setBackupBusy(true);
    setActivityMessage("Encrypting backup…");
    try {
      const encrypted = await encryptBackup(accounts, backupPassword);
      const filename = `kaalkey-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.kkbackup`;

      if (Platform.OS === "web") {
        if (typeof document === "undefined" || typeof URL === "undefined") {
          throw new Error("Your browser does not support downloading backup files.");
        }
        const blob = new Blob([encrypted], { type: "application/json;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        setBackupVisible(false);
        setBackupPassword("");
        showBackupMessage(
          "Backup created",
          "Your encrypted KaalKey backup has been downloaded. Keep the file and password private.",
        );
        return;
      }

      const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!base) throw new Error("A local file location is unavailable on this device.");
      const uri = `${base}${filename}`;
      await FileSystem.writeAsStringAsync(uri, encrypted, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (!(await Sharing.isAvailableAsync())) {
        showBackupMessage("Backup created", `Encrypted backup saved temporarily at:\n${uri}`);
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Save your encrypted KaalKey backup",
          UTI: "public.json",
        });
      }
      setBackupVisible(false);
      setBackupPassword("");
    } catch (error) {
      showBackupMessage(
        "Backup failed",
        error instanceof Error ? error.message : "KaalKey could not create the backup.",
      );
    } finally {
      setBackupBusy(false);
      setActivityMessage(null);
    }
  }

  async function pickBackupText(): Promise<string | null> {
    if (Platform.OS !== "web") {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "public.json", "*/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return null;
      return FileSystem.readAsStringAsync(picked.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Use a native browser file input on web; Expo DocumentPicker/FileSystem URI
    // handling is not reliable for browser File objects and blob URLs.
    return new Promise<string | null>((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("The browser file picker is unavailable."));
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".kkbackup,.json,application/json,text/plain";
      input.style.position = "fixed";
      input.style.left = "-10000px";
      input.style.width = "1px";
      input.style.height = "1px";
      const cleanup = () => input.remove();
      input.addEventListener(
        "change",
        () => {
          const file = input.files?.[0];
          cleanup();
          if (!file) {
            resolve(null);
            return;
          }
          void file.text().then(resolve, reject);
        },
        { once: true },
      );
      input.addEventListener(
        "cancel",
        () => {
          cleanup();
          resolve(null);
        },
        { once: true },
      );
      document.body.appendChild(input);
      input.click();
    });
  }

  async function restoreEncryptedBackup() {
    if (!backupPassword) {
      showBackupMessage(
        "Enter your backup password",
        "Enter the password used when this backup was created.",
      );
      return;
    }
    setBackupBusy(true);
    try {
      const raw = await pickBackupText();
      if (raw === null) return;
      setActivityMessage("Decrypting backup…");
      const restored = await decryptBackup(raw, backupPassword);
      setActivityMessage(null);
      const message = `This backup contains ${restored.length} account${restored.length === 1 ? "" : "s"}. KaalKey will keep your existing accounts and add accounts from the backup that are not already present. Duplicate accounts will be skipped.`;
      let shouldMerge = false;
      if (Platform.OS === "web") {
        shouldMerge =
          typeof window !== "undefined" && window.confirm(`Merge backup accounts?\n\n${message}`);
      } else {
        shouldMerge = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Merge backup accounts?",
            message,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Merge accounts", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
          );
        });
      }
      if (!shouldMerge) return;
      setActivityMessage("Restoring accounts…");

      // Merge by account identity; keep existing local accounts unchanged.
      const identity = (account: Account) =>
        [
          account.issuer.trim().toLocaleLowerCase(),
          account.name.trim().toLocaleLowerCase(),
          account.secret.replace(/[\s-]/g, "").toUpperCase(),
          account.algorithm,
          String(account.digits),
          String(account.period),
        ].join("|");
      const merged = [...accounts];
      const identities = new Set(merged.map(identity));
      const ids = new Set(merged.map((account) => account.id));
      let added = 0;
      for (const account of restored) {
        const key = identity(account);
        if (identities.has(key)) continue;
        let id = account.id;
        if (!id || ids.has(id)) {
          id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          while (ids.has(id)) id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }
        const safeAccount = { ...account, id };
        merged.push(safeAccount);
        identities.add(key);
        ids.add(id);
        added += 1;
      }
      await writeAccountsStorage(JSON.stringify(merged));
      setAccounts(merged);
      setBackupVisible(false);
      setSettingsVisible(false);
      setBackupPassword("");
      showBackupMessage(
        "Restore complete",
        `Added ${added} account${added === 1 ? "" : "s"}. ${restored.length - added} duplicate account${restored.length - added === 1 ? " was" : "s were"} skipped. Your existing accounts were kept.`,
      );
    } catch (error) {
      showBackupMessage(
        "Restore failed",
        error instanceof Error ? error.message : "The backup could not be read or saved.",
      );
    } finally {
      setBackupBusy(false);
      setActivityMessage(null);
    }
  }

  const visibleAccounts = accounts
    .filter((account) => {
      const query = searchQuery.trim().toLowerCase();
      return (
        !query ||
        account.issuer.toLowerCase().includes(query) ||
        account.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const first = sortBy === "service" ? a.issuer : a.name;
      const second = sortBy === "service" ? b.issuer : b.name;
      return first.localeCompare(second, undefined, { sensitivity: "base" });
    });

  // Branded in-app splash: keep the styled brand text visible for five seconds.
  // This overlay never exposes the vault while lock preferences are loading.
  if (showBrandSplash || !legalLoaded) {
    return (
      <SafeAreaView style={styles.splashScreen} edges={["top", "right", "bottom", "left"]}>
        <View style={styles.splashBrandCard}>
          <Image
            source={require("../../assets/images/kaalkey-full-logo-white.png")}
            style={styles.splashLogo}
            resizeMode="contain"
            accessibilityLabel="KaalKey tricolour lock emblem"
          />
          <Text style={styles.splashTitle}>
            <Text style={styles.splashKaal}>Kaal</Text>
            <Text style={styles.splashK}>K</Text>
            <Text style={styles.splashEy}>ey</Text>
          </Text>
          <Text style={styles.splashSubtitle}>AUTHENTICATOR</Text>
          <View style={styles.splashBadge}>
            <View style={styles.splashDot} />
            <Text style={styles.splashBadgeText}>YOUR LOCAL VAULT</Text>
          </View>
          <View style={styles.splashDivider} />
          <Text style={styles.splashTagline}>Your codes. Your device. Your control.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // First-launch legal notice is embedded and available offline. The vault is not shown until accepted.
  if (!legalAccepted || legalReviewVisible) {
    const firstLaunch = !legalAccepted;
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F5F7FB" }}
        edges={["top", "right", "bottom", "left"]}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              marginBottom: 18,
              paddingVertical: 2,
            }}
          >
            <Image
              source={require("../../assets/images/kaalkey-emblem.png")}
              style={{ width: 88, height: 80 }}
              resizeMode="contain"
              accessibilityLabel="Original multicolour KaalKey authenticator emblem"
            />
            <View style={{ flex: 1, alignItems: "flex-start", justifyContent: "center" }}>
              <Text style={{ fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: 0.1 }}>
                <Text style={{ color: "#FF9800" }}>Kaal</Text>
                <Text style={{ color: "#1769E0" }}>K</Text>
                <Text style={{ color: "#168A35" }}>ey</Text>
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 16,
                  letterSpacing: 2.1,
                  color: "#4B5563",
                  fontWeight: "800",
                  marginTop: 1,
                }}
              >
                AUTHENTICATOR
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 7,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: "#D6E0EE",
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#168A35" }}
                />
                <Text
                  style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "#52627A" }}
                >
                  LOCAL VAULT
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 23, fontWeight: "800", color: "#14233D", marginBottom: 6 }}>
            {firstLaunch ? "Legal & Privacy Notice" : "Legal information"}
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 19, color: "#52627A", marginBottom: 12 }}>
            {firstLaunch
              ? "Please review both documents before using KaalKey. They are included in the app and available offline."
              : "Review KaalKey’s privacy information and terms of use."}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => setLegalDocument("privacy")}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 12,
                backgroundColor: legalDocument === "privacy" ? "#183B68" : "#E6EBF3",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: legalDocument === "privacy" ? "#FFFFFF" : "#31435E",
                  fontWeight: "700",
                }}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLegalDocument("terms")}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 12,
                backgroundColor: legalDocument === "terms" ? "#183B68" : "#E6EBF3",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: legalDocument === "terms" ? "#FFFFFF" : "#31435E",
                  fontWeight: "700",
                }}
              >
                Terms of Use
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#E0E6EF",
            }}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {legalDocument === "privacy" ? (
              <>
                <Text
                  style={{ fontSize: 19, fontWeight: "800", color: "#172A46", marginBottom: 5 }}
                >
                  Privacy Policy
                </Text>
                <Text style={{ fontSize: 12, color: "#718097", marginBottom: 14 }}>
                  Version {LEGAL_VERSION} · Applies to KaalKey Authenticator
                </Text>
                <Text style={legalHeadingStyle}>1. Information and secrets</Text>
                <Text style={legalBodyStyle}>
                  KaalKey is an authenticator app. Account labels and the secret values needed to
                  generate one-time codes are sensitive. The app is designed to store account
                  records in the device’s secure storage. Anyone with access to an unlocked device
                  or an exported backup may be able to access sensitive information.
                </Text>
                <Text style={legalHeadingStyle}>2. Permissions and device features</Text>
                <Text style={legalBodyStyle}>
                  If you choose to scan a QR code, KaalKey uses camera permission for that action.
                  Optional device authentication and haptic feedback use the relevant device
                  features. You can manage permissions in your device settings.
                </Text>
                <Text style={legalHeadingStyle}>3. Backups</Text>
                <Text style={legalBodyStyle}>
                  When you create a backup, KaalKey encrypts the backup using a password you choose.
                  Keep both the file and password private and store them securely. Anyone who
                  obtains the file and its password may be able to restore your authenticator
                  accounts. KaalKey cannot recover a forgotten backup password.
                </Text>
                <Text style={legalHeadingStyle}>4. Sharing and third parties</Text>
                <Text style={legalBodyStyle}>
                  The backup flow may use your device’s share sheet or file picker to save,
                  transfer, or select files. The privacy practices of any third-party app or service
                  you choose are governed by that provider. This notice does not make a blanket
                  claim that your device, operating system, or chosen sharing services never process
                  data.
                </Text>
                <Text style={legalHeadingStyle}>5. Security and retention</Text>
                <Text style={legalBodyStyle}>
                  Keep your device updated, protect it with a screen lock, and do not share OTP
                  secrets or backup passwords. Removing the app, clearing its data, or losing the
                  device may make locally stored accounts unavailable. Maintain a secure backup if
                  you need recovery.
                </Text>
                <Text style={legalHeadingStyle}>6. Changes and contact</Text>
                <Text style={legalBodyStyle}>
                  This embedded notice may be revised in a future app release. For privacy
                  questions, contact the app publisher through the official support channel provided
                  with the app.
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{ fontSize: 19, fontWeight: "800", color: "#172A46", marginBottom: 5 }}
                >
                  Terms of Use
                </Text>
                <Text style={{ fontSize: 12, color: "#718097", marginBottom: 14 }}>
                  Version {LEGAL_VERSION} · Applies to KaalKey Authenticator
                </Text>
                <Text style={legalHeadingStyle}>1. Your use</Text>
                <Text style={legalBodyStyle}>
                  You may use KaalKey to generate verification codes for accounts you are authorized
                  to access. You are responsible for complying with applicable laws and the rules of
                  the services for which you use authentication codes.
                </Text>
                <Text style={legalHeadingStyle}>2. Protect your accounts</Text>
                <Text style={legalBodyStyle}>
                  You are responsible for securing your device, authenticator secrets, recovery
                  methods, exported backups, and backup passwords. Do not share codes or secrets
                  with people you do not trust.
                </Text>
                <Text style={legalHeadingStyle}>3. No recovery guarantee</Text>
                <Text style={legalBodyStyle}>
                  KaalKey cannot guarantee that every account can be recovered, that every QR code
                  or configuration will be compatible, or that the app will operate without
                  interruption or error. Keep alternative recovery methods provided by the relevant
                  service.
                </Text>
                <Text style={legalHeadingStyle}>4. No professional advice</Text>
                <Text style={legalBodyStyle}>
                  The app is a utility and does not provide legal, financial, or security
                  incident-response advice. If an account is compromised, follow the affected
                  service’s official recovery and security guidance.
                </Text>
                <Text style={legalHeadingStyle}>5. Changes and availability</Text>
                <Text style={legalBodyStyle}>
                  Features may change between releases. You should keep the app updated and
                  periodically verify that your backup and recovery arrangements work.
                </Text>
                <Text style={legalHeadingStyle}>6. Liability and applicable law</Text>
                <Text style={legalBodyStyle}>
                  To the extent permitted by applicable law, the app is provided without a guarantee
                  of uninterrupted or error-free operation. Nothing in these terms excludes rights
                  or remedies that cannot legally be excluded. Any further limitations or
                  governing-law terms should be reviewed by a qualified lawyer for the publisher’s
                  jurisdiction before release.
                </Text>
              </>
            )}
          </ScrollView>
          {firstLaunch ? (
            <>
              <TouchableOpacity
                onPress={() => setLegalChecked((v) => !v)}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: legalChecked }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: legalChecked ? "#1D6B4A" : "#8997AA",
                    backgroundColor: legalChecked ? "#1D6B4A" : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                    {legalChecked ? "✓" : ""}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: "#34445D", fontSize: 12, lineHeight: 18 }}>
                  I have read and agree to the Privacy Policy and Terms of Use.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!legalChecked || legalSaving}
                onPress={() => void acceptLegalNotice()}
                style={{
                  backgroundColor: legalChecked ? "#183B68" : "#AAB5C4",
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
                  {legalSaving ? "Saving…" : "Accept & Continue"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setLegalReviewVisible(false)}
              style={{
                backgroundColor: "#183B68",
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Do not render the account screen, modals, or navigation beneath a lock overlay.
  // The vault remains inaccessible until the native OS authentication API explicitly returns success.
  if (!biometricReady || (biometricEnabled && !isUnlocked)) {
    return (
      <SafeAreaView style={styles.lockScreen} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.lockCard}>
          <View style={styles.lockIconCircle}>
            <Text style={styles.lockIcon}>🔐</Text>
          </View>
          <Text style={styles.lockBrand}>KaalKey</Text>
          <Text style={styles.lockTitle}>
            {!biometricReady ? "Securing your vault…" : "Your vault is protected"}
          </Text>
          <Text style={styles.lockDescription}>
            {!biometricReady
              ? "Checking your secure lock settings. Your codes remain hidden."
              : "Use your phone’s biometrics or screen-lock PIN, pattern, or password to access your one-time verification codes."}
          </Text>
          {biometricReady && (
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => void authenticateUser()}
              disabled={authenticating}
              activeOpacity={0.82}
            >
              <Text style={styles.unlockButtonText}>
                {authenticating ? "Waiting for verification…" : "Unlock securely"}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.lockFootnote}>Your secrets stay stored on this device.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandMarkFrame}>
            <Image
              source={require("../../assets/images/kaalkey-full-logo-white.png")}
              style={styles.brandMark}
              resizeMode="contain"
              accessibilityLabel="KaalKey tricolour lock emblem"
            />
          </View>
          <View style={styles.brandTextBlock}>
            <Text style={styles.brandName}>
              <Text style={styles.brandKaal}>Kaal</Text>
              <Text style={styles.brandK}>K</Text>
              <Text style={styles.brandEy}>ey</Text>
            </Text>
            <Text style={styles.brandSubtitle}>AUTHENTICATOR</Text>
            <View style={styles.secureBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.secureText}>LOCAL VAULT</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.securityButton, biometricEnabled && styles.securityButtonActive]}
            onPress={() => void toggleBiometricLock()}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={biometricEnabled ? "Disable app lock" : "Enable app lock"}
          >
            <Text style={styles.securityButtonIcon}>{biometricEnabled ? "🔒" : "🔐"}</Text>
            <Text
              style={[
                styles.securityButtonText,
                biometricEnabled && styles.securityButtonTextActive,
              ]}
            >
              {biometricEnabled ? "LOCK ON" : "SECURITY"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconButton}
            onPress={() => {
              hapticFeedback("selection");
              setSettingsVisible(true);
            }}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Open app settings"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tricolorStripe}>
        <View style={[styles.tricolorSegment, { backgroundColor: "#FF9800" }]} />
        <View style={[styles.tricolorSegment, { backgroundColor: "#FFFFFF" }]} />
        <View style={[styles.tricolorSegment, { backgroundColor: "#138808" }]} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 48) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your accounts</Text>

            <Text style={styles.accountCount}>
              {accounts.length} {accounts.length === 1 ? "ACCOUNT" : "ACCOUNTS"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.78}
            onPress={openAddAccount}
            accessibilityRole="button"
            accessibilityLabel="Add account"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {accounts.length > 0 && (
          <View style={styles.organizePanel}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search service or account"
                placeholderTextColor="#8290A7"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search accounts"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery("")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                >
                  <Text style={styles.clearSearchButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>SORT BY</Text>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === "service" && styles.sortButtonActive]}
                onPress={() => {
                  hapticFeedback("selection");
                  setSortBy("service");
                }}
                accessibilityRole="button"
                accessibilityLabel="Sort by service name"
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "service" && styles.sortButtonTextActive,
                  ]}
                >
                  Service
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === "account" && styles.sortButtonActive]}
                onPress={() => {
                  hapticFeedback("selection");
                  setSortBy("account");
                }}
                accessibilityRole="button"
                accessibilityLabel="Sort by account name"
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "account" && styles.sortButtonTextActive,
                  ]}
                >
                  Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!loaded ? (
          <Text style={styles.emptyText}>Loading secure vault...</Text>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>

            <Text style={styles.emptyTitle}>Your vault starts here</Text>

            <Text style={styles.emptyText}>
              Add an account using its secret key to generate your first verification code.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={openAddAccount}>
              <Text style={styles.primaryButtonText}>Add your first account</Text>
            </TouchableOpacity>
          </View>
        ) : visibleAccounts.length === 0 ? (
          <Text style={styles.emptyText}>No accounts match your search.</Text>
        ) : (
          visibleAccounts.map((account) => {
            const code = generateCode(account);
            const period = Math.max(1, account.period || 30);
            const elapsed = now > 0 ? (now / 1000) % period : 0;
            const secondsRemaining = Math.max(1, Math.ceil(period - elapsed));

            return (
              <View key={account.id} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountIcon}>
                    <Text style={styles.accountIconText}>
                      {account.issuer.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.accountInfo}>
                    <Text style={styles.accountIssuer}>{account.issuer}</Text>

                    <Text style={styles.accountName}>{account.name}</Text>
                  </View>

                  <View style={styles.accountActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openAccountQr(account)}
                      accessibilityRole="button"
                      accessibilityLabel={"View QR code for " + account.issuer}
                    >
                      <Text style={styles.editButtonText}>QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditAccount(account)}
                      accessibilityRole="button"
                      accessibilityLabel={"Edit " + account.issuer + " account"}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteAccount(account.id)}
                      accessibilityRole="button"
                      accessibilityLabel={"Remove " + account.issuer + " account"}
                    >
                      <Text style={styles.deleteIcon}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.codeRow}>
                  <TouchableOpacity
                    style={styles.codeArea}
                    activeOpacity={0.68}
                    onPress={() => void copyCode(code)}
                    accessibilityRole="button"
                    accessibilityLabel={"Copy verification code for " + account.issuer}
                  >
                    <Text style={styles.code}>
                      {code.slice(0, 3)} {code.slice(3)}
                    </Text>

                    <Text style={styles.copyHint}>TAP TO COPY</Text>
                  </TouchableOpacity>

                  <CountdownRing secondsRemaining={secondsRemaining} period={period} />
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>KAALKEY AUTHENTICATOR</Text>

          <Text style={styles.footerText}>Your codes. Your device. Your control.</Text>

          <Text style={styles.version}>VERSION 1.0.0</Text>
        </View>
      </ScrollView>

      <Modal
        visible={qrAccount !== null}
        transparent
        animationType="fade"
        onRequestClose={closeAccountQr}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(8, 20, 38, 0.72)",
            justifyContent: "center",
            padding: 22,
            ...(Platform.OS === "android"
              ? {
                  paddingTop: Math.max(insets.top + 22, 34),
                  paddingBottom: Math.max(insets.bottom + 22, 34),
                }
              : {}),
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 22,
              padding: 22,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#172A46", fontSize: 21, fontWeight: "800", marginBottom: 8 }}>
              Account QR code
            </Text>
            <Text
              style={{
                color: "#53637A",
                fontSize: 14,
                lineHeight: 20,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {qrAccount?.issuer} · {qrAccount?.name}
            </Text>
            {!qrRevealed ? (
              <>
                <Text
                  style={{
                    color: "#8A3B18",
                    fontSize: 14,
                    lineHeight: 21,
                    textAlign: "center",
                    marginBottom: 18,
                  }}
                >
                  Warning: anyone who scans this QR code can generate verification codes for this
                  account. Only reveal it on a trusted screen.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { width: "100%" }]}
                  onPress={() => setQrRevealed(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Reveal QR code</Text>
                </TouchableOpacity>
              </>
            ) : qrAccount ? (
              <>
                <QRCode
                  value={createAccountOtpAuthUrl(qrAccount)}
                  size={230}
                  backgroundColor="#FFFFFF"
                  color="#111827"
                />
                <Text
                  style={{
                    color: "#66738A",
                    fontSize: 12,
                    lineHeight: 18,
                    textAlign: "center",
                    marginTop: 14,
                    marginBottom: 12,
                  }}
                >
                  Keep this QR code private. Scanning it copies the account’s authenticator secret.
                </Text>
              </>
            ) : null}
            <TouchableOpacity
              style={[styles.cancelButton, { width: "100%", marginTop: 10 }]}
              onPress={closeAccountQr}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setEditingId(null);
        }}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalBackdrop,
            Platform.OS === "android" && {
              paddingTop: Math.max(insets.top + 16, 32),
              paddingBottom: Math.max(insets.bottom + 16, 32),
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalTitle}>
                    {editingId ? "Edit account" : "Add account"}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editingId
                      ? "Update the service, account name, or secret key."
                      : "Scan a QR code for the easiest setup, or enter details manually."}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setEditingId(null);
                  }}
                  style={styles.modalCloseButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close account form"
                  hitSlop={8}
                >
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

              {!editingId && (
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => void openQrScanner()}
                  accessibilityRole="button"
                  accessibilityLabel="Scan authenticator QR code"
                >
                  <Text style={styles.scanButtonIcon}>▦</Text>
                  <View style={styles.scanButtonCopy}>
                    <Text style={styles.scanButtonTitle}>Scan QR code</Text>
                    <Text style={styles.scanButtonSubtitle}>
                      Use your camera to add an account instantly
                    </Text>
                  </View>
                  <Text style={styles.scanButtonArrow}>›</Text>
                </TouchableOpacity>
              )}

              {!editingId && (
                <TouchableOpacity
                  style={[styles.scanButton, styles.importQrButton]}
                  onPress={() => void importQrImage()}
                  accessibilityRole="button"
                  accessibilityLabel="Import QR code image"
                >
                  <Text style={styles.scanButtonIcon}>▧</Text>
                  <View style={styles.scanButtonCopy}>
                    <Text style={styles.scanButtonTitle}>Import QR image</Text>
                    <Text style={styles.scanButtonSubtitle}>
                      Choose a QR screenshot from Gallery, Photos, or Files
                    </Text>
                  </View>
                  <Text style={styles.scanButtonArrow}>›</Text>
                </TouchableOpacity>
              )}

              {!editingId && (
                <TouchableOpacity
                  style={[styles.scanButton, styles.importQrButton]}
                  onPress={() => void pasteQrImage()}
                  accessibilityRole="button"
                >
                  <Text style={styles.scanButtonIcon}>▣</Text>
                  <View style={styles.scanButtonCopy}>
                    <Text style={styles.scanButtonTitle}>Paste QR image</Text>
                    <Text style={styles.scanButtonSubtitle}>
                      Copy a QR image, then paste it here
                    </Text>
                  </View>
                  <Text style={styles.scanButtonArrow}>›</Text>
                </TouchableOpacity>
              )}
              {!editingId && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>TOTP SETUP URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="otpauth://totp/..."
                    placeholderTextColor="#66738A"
                    value={totpUrlInput}
                    onChangeText={setTotpUrlInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="TOTP setup URL"
                  />
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[styles.scanButton, { flex: 1 }]}
                      onPress={() => void importTotpUrl()}
                    >
                      <Text style={styles.scanButtonTitle}>Import URL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.scanButton, { flex: 1 }]}
                      onPress={() => void pasteTotpUrl()}
                    >
                      <Text style={styles.scanButtonTitle}>Paste URL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {!editingId && (
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setManualExpanded((expanded) => !expanded)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: manualExpanded }}
                >
                  <View style={styles.scanButtonCopy}>
                    <Text style={styles.scanButtonTitle}>
                      {manualExpanded ? "Hide manual entry" : "Enter details manually"}
                    </Text>
                    <Text style={styles.scanButtonSubtitle}>
                      Service, account name and secret key
                    </Text>
                  </View>
                  <Text style={styles.scanButtonArrow}>{manualExpanded ? "⌄" : "›"}</Text>
                </TouchableOpacity>
              )}
              {(editingId || manualExpanded) && (
                <>
                  {!editingId && (
                    <Text style={styles.manualEntryLabel}>OR ENTER DETAILS MANUALLY</Text>
                  )}

                  <Text style={styles.inputLabel}>SERVICE / ISSUER</Text>

                  <View style={styles.inputClearWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithClearSpace]}
                      placeholder="e.g. Google"
                      placeholderTextColor="#66738A"
                      value={issuer}
                      onChangeText={setIssuer}
                      autoCapitalize="words"
                      accessibilityLabel="Service or issuer"
                    />
                    {issuer.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearInputButton}
                        onPress={() => setIssuer("")}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Clear service or issuer"
                        hitSlop={6}
                      >
                        <Text style={styles.clearInputButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>ACCOUNT NAME</Text>

                  <View style={styles.inputClearWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithClearSpace]}
                      placeholder="e.g. you@example.com"
                      placeholderTextColor="#66738A"
                      value={accountName}
                      onChangeText={setAccountName}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      accessibilityLabel="Account name"
                    />
                    {accountName.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearInputButton}
                        onPress={() => setAccountName("")}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Clear account name"
                        hitSlop={6}
                      >
                        <Text style={styles.clearInputButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!editingId && (
                    <>
                      <Text style={styles.inputLabel}>
                        {editingId ? "SECRET KEY (LOCKED)" : "SECRET KEY (BASE32)"}
                      </Text>

                      <View style={styles.inputClearWrapper}>
                        <TextInput
                          style={[styles.input, styles.inputWithClearSpace]}
                          placeholder="Enter your setup key"
                          placeholderTextColor="#66738A"
                          value={secret}
                          onChangeText={setSecret}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          secureTextEntry
                          editable={!editingId}
                          selectTextOnFocus={!editingId}
                          accessibilityLabel={
                            editingId
                              ? "Secret key, read-only while editing"
                              : "Secret key in Base32"
                          }
                        />
                        {!editingId && secret.length > 0 && (
                          <TouchableOpacity
                            style={styles.clearInputButton}
                            onPress={() => setSecret("")}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Clear secret key"
                            hitSlop={6}
                          >
                            <Text style={styles.clearInputButtonText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.inputLabel}>OTP ALGORITHM</Text>
                      <View style={styles.optionRow}>
                        {(["SHA1", "SHA256", "SHA512"] as const).map((algorithm) => (
                          <TouchableOpacity
                            key={algorithm}
                            style={[
                              styles.optionChip,
                              otpAlgorithm === algorithm && styles.optionChipSelected,
                            ]}
                            onPress={() => setOtpAlgorithm(algorithm)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: otpAlgorithm === algorithm }}
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                otpAlgorithm === algorithm && styles.optionChipTextSelected,
                              ]}
                            >
                              {algorithm.replace("SHA", "SHA-")}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.inputLabel}>OTP DIGITS</Text>
                      <View style={styles.optionRow}>
                        {[6, 7, 8].map((digits) => (
                          <TouchableOpacity
                            key={digits}
                            style={[
                              styles.optionChip,
                              otpDigits === digits && styles.optionChipSelected,
                            ]}
                            onPress={() => setOtpDigits(digits)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: otpDigits === digits }}
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                otpDigits === digits && styles.optionChipTextSelected,
                              ]}
                            >
                              {digits} digits
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.inputLabel}>REFRESH INTERVAL (SECONDS)</Text>
                      <TextInput
                        style={styles.input}
                        value={otpPeriod}
                        onChangeText={(value) =>
                          setOtpPeriod(value.replace(/[^0-9]/g, "").slice(0, 3))
                        }
                        keyboardType="number-pad"
                        placeholder="1–120 seconds"
                        placeholderTextColor="#66738A"
                        accessibilityLabel="OTP refresh interval in seconds"
                      />
                      <View style={styles.optionRow}>
                        {[15, 30, 60, 90, 120].map((period) => (
                          <TouchableOpacity
                            key={period}
                            style={[
                              styles.optionChip,
                              Number(otpPeriod) === period && styles.optionChipSelected,
                            ]}
                            onPress={() => setOtpPeriod(String(period))}
                            accessibilityRole="button"
                            accessibilityState={{ selected: Number(otpPeriod) === period }}
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                Number(otpPeriod) === period && styles.optionChipTextSelected,
                              ]}
                            >
                              {period}s
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.securityNote}>
                        Use the secret key supplied by the service you are configuring. Never enter
                        your account password here. Match the algorithm, digit count, and interval
                        to the service&apos;s setup instructions.
                      </Text>
                    </>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={() => void saveAccount()}>
                <Text style={styles.primaryButtonText}>
                  {editingId ? "Save changes securely" : "Save account securely"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditingId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => {
          setScannerVisible(false);
          setModalVisible(true);
        }}
      >
        <ScrollView
          style={styles.scannerContainer}
          contentContainerStyle={[
            styles.scannerScrollContent,
            {
              paddingTop: Math.max(insets.top + 12, 24),
              paddingBottom: Math.max(insets.bottom + 24, 36),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => {
                setScannerVisible(false);
                setModalVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Back to add account"
            >
              <Text style={styles.scannerBack}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.scannerStep}>SECURE SETUP</Text>
          </View>

          <View style={styles.scannerIntro}>
            <Text style={styles.scannerTitle}>Scan QR code</Text>
            <Text style={styles.scannerSubtitle}>
              Point your camera at the authenticator setup QR code from the service you are adding.
            </Text>
          </View>

          <View style={[styles.cameraFrame, { height: scannerCameraHeight }]}>
            {scannerVisible && Platform.OS === "web" ? (
              <WebQrScanner
                active={scannerVisible && !scanned}
                onDetected={(data) => void handleQrScanned(data)}
              />
            ) : scannerVisible && cameraPermission?.granted ? (
              <CameraView
                style={styles.cameraPreview}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : ({ data }) => void handleQrScanned(data)}
              />
            ) : (
              <View style={styles.cameraUnavailable}>
                <Text style={styles.cameraUnavailableText}>
                  Camera unavailable. Check camera permission and try again.
                </Text>
              </View>
            )}
            <View pointerEvents="none" style={styles.scanCornerTL} />
            <View pointerEvents="none" style={styles.scanCornerTR} />
            <View pointerEvents="none" style={styles.scanCornerBL} />
            <View pointerEvents="none" style={styles.scanCornerBR} />
          </View>

          <Text style={styles.scannerHint}>
            Keep the entire QR code visible. Your secret stays on this device.
          </Text>

          <TouchableOpacity
            style={styles.scannerManualButton}
            onPress={() => {
              setScannerVisible(false);
              setModalVisible(true);
            }}
          >
            <Text style={styles.scannerManualText}>Enter details manually instead</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

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
                  activeOpacity={0.82}
                >
                  <Text style={styles.backupActionIcon}>⬆</Text>
                  <Text style={styles.backupActionTitle}>Create backup</Text>
                  <Text style={styles.backupActionDescription}>Encrypted file</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backupActionButton}
                  onPress={() => openBackup("restore")}
                  activeOpacity={0.82}
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
                activeOpacity={0.85}
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
                      backupMode === "export" ? "At least 10 characters" : "Enter backup password"
                    }
                    placeholderTextColor="#8290A7"
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
                      activeOpacity={0.7}
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
                    Use a unique password with at least 10 characters. If you lose it, the backup
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
      <Modal
        visible={activityMessage !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        hardwareAccelerated
        presentationStyle="overFullScreen"
        onRequestClose={() => {}}
      >
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={activityMessage ?? "Working"}
          // Keep the activity layer above every app dialog on web and native.
          // The Modal is rendered last in this screen so it also wins portal order.
          pointerEvents="auto"
          style={{
            flex: 1,
            zIndex: 2147483647,
            elevation: 2147483647,
            backgroundColor: "rgba(8, 18, 32, 0.42)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            ...(Platform.OS === "android"
              ? {
                  paddingTop: Math.max(insets.top + 24, 36),
                  paddingBottom: Math.max(insets.bottom + 24, 36),
                }
              : {}),
          }}
        >
          <View
            style={{
              minWidth: 190,
              maxWidth: 300,
              paddingVertical: 24,
              paddingHorizontal: 28,
              borderRadius: 18,
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <ActivityIndicator size="large" color="#D98200" />
            <Text
              style={{
                color: "#172A46",
                fontSize: 14,
                fontWeight: "700",
                marginTop: 14,
                textAlign: "center",
              }}
            >
              {activityMessage ?? "Please wait…"}
            </Text>
            <Text style={{ color: "#64748B", fontSize: 12, marginTop: 6, textAlign: "center" }}>
              Please don’t close or interact with KaalKey.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
