import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as OTPAuth from "otpauth";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Account } from "../types/account";
import { encryptBackup, decryptBackup } from "../services/backup";
import { generateCode } from "../services/otp";
import CountdownRing from "../components/CountdownRing";
import { styles } from "../styles/home.styles";


const STORAGE_KEY = "kaalkey_accounts_v1";
const BIOMETRIC_ENABLED_KEY = "kaalkey_biometric_lock_enabled_v1";
const HAPTICS_ENABLED_KEY = "kaalkey_haptics_enabled_v1";

let hapticsAreEnabled = true;

// Optional haptic feedback; failures never interrupt account actions.
function hapticFeedback(kind: "selection" | "success" | "warning" = "selection") {
  if (!hapticsAreEnabled) return;
  try {
    if (Platform.OS === "android") {
      const pattern = kind === "success" ? [0, 22, 45, 28] : kind === "warning" ? [0, 38, 55, 38] : 12;
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [now, setNow] = useState(0);
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
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const authenticatingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"service" | "account">("service");
  const [issuer, setIssuer] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secret, setSecret] = useState("");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowBrandSplash(false), 5000);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    setNow(Date.now());

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved) as Account[];

          if (Array.isArray(parsed)) {
            setAccounts(parsed);
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
    return () => { mounted = false; };
  }, []);

  async function toggleHaptics() {
    const next = !hapticsEnabled;
    try {
      await SecureStore.setItemAsync(HAPTICS_ENABLED_KEY, String(next));
      hapticsAreEnabled = next;
      setHapticsEnabled(next);
      if (next) hapticFeedback("success");
    } catch {
      Alert.alert("Could not save setting", "Haptic feedback preference could not be saved. Please try again.");
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
    return () => { mounted = false; };
  }, []);

  async function authenticateUser(
    promptMessage = "Unlock KaalKey Authenticator",
    unlockOnSuccess = true
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
          "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional."
        );
      } else if (result.error === "not_available") {
        Alert.alert(
          "Device authentication unavailable",
          "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again."
        );
      } else if (result.error === "lockout") {
        Alert.alert(
          "Authentication temporarily locked",
          "Your phone has temporarily disabled authentication after too many attempts. Wait and try again."
        );
      }
      // Cancellation, failed verification, and every other error leave the vault locked.
      return false;
    } catch {
      Alert.alert("Authentication unavailable", "KaalKey could not start the phone's secure authentication prompt. Please try again.");
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
      const message = "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.";
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
      Alert.alert("App lock enabled", "KaalKey will request your phone's built-in authentication when opened and when you return to it.");
    } catch {
      Alert.alert("Could not save setting", "App lock could not be enabled. Please try again.");
    }
  }

  useEffect(() => {
    if (biometricReady && biometricEnabled && !isUnlocked) {
      void authenticateUser();
    }
    // Prompt once when the saved lock setting requires authentication.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricReady, biometricEnabled, isUnlocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded = /inactive|background/.test(appStateRef.current);
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
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));

      setAccounts(updated);
      return true;
    } catch {
      Alert.alert("Storage error", "Accounts could not be saved securely.");

      return false;
    }
  }

  function openAddAccount() {
    hapticFeedback("selection");
    setEditingId(null);
    setIssuer("");
    setAccountName("");
    setSecret("");
    setModalVisible(true);
  }

  function openEditAccount(account: Account) {
    hapticFeedback("selection");
    setEditingId(account.id);
    setIssuer(account.issuer);
    setAccountName(account.name);
    setSecret(account.secret);
    setModalVisible(true);
  }

  async function saveAccount() {
    const normalizedSecret = secret.replace(/[\s-]/g, "").toUpperCase();
    const normalizedIssuer = issuer.trim();
    const normalizedName = accountName.trim();

    if (!normalizedIssuer || !normalizedName || !normalizedSecret) {
      Alert.alert(
        "Missing information",
        "Enter the service name, account name, and secret key.",
      );
      return;
    }

    try {
      const validationTotp = new OTPAuth.TOTP({
        issuer: normalizedIssuer,
        label: normalizedName,
        algorithm: editingId
          ? accounts.find((item) => item.id === editingId)?.algorithm ?? "SHA1"
          : "SHA1",
        digits: editingId
          ? accounts.find((item) => item.id === editingId)?.digits ?? 6
          : 6,
        period: editingId
          ? accounts.find((item) => item.id === editingId)?.period ?? 30
          : 30,
        secret: normalizedSecret,
      });
      validationTotp.generate();

      const duplicate = accounts.some(
        (existing) =>
          existing.id !== editingId &&
          existing.issuer.toLowerCase() === normalizedIssuer.toLowerCase() &&
          existing.name.toLowerCase() === normalizedName.toLowerCase(),
      );

      if (duplicate) {
        Alert.alert(
          "Account already exists",
          "An account with this service and account name is already saved.",
        );
        return;
      }

      let updated: Account[];
      if (editingId) {
        updated = accounts.map((existing) =>
          existing.id === editingId
            ? {
                ...existing,
                issuer: normalizedIssuer,
                name: normalizedName,
                secret: normalizedSecret,
              }
            : existing,
        );
      } else {
        const account: Account = {
          id: Date.now().toString() + "-" + Math.random().toString(36).slice(2),
          issuer: normalizedIssuer,
          name: normalizedName,
          secret: normalizedSecret,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        };
        updated = [...accounts, account];
      }

      const saved = await saveAccounts(updated);
      if (saved) {
        hapticFeedback("success");
        setIssuer("");
        setAccountName("");
        setSecret("");
        setEditingId(null);
        setModalVisible(false);
        Alert.alert("Account saved", editingId ? "Your account was updated." : "Your account was added securely.");
      }
    } catch {
      Alert.alert(
        "Invalid secret key",
        "Please check that you entered a valid Base32 secret.",
      );
    }
  }

  async function openQrScanner() {
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

  async function handleQrScanned(data: string) {
    if (scanned) return;

    setScanned(true);

    try {
      if (!data.toLowerCase().startsWith("otpauth://totp/")) {
        Alert.alert(
          "Unsupported QR code",
          "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.",
        );
        setScanned(false);
        return;
      }

      const parsed = OTPAuth.URI.parse(data);

      if (!(parsed instanceof OTPAuth.TOTP)) {
        Alert.alert(
          "Unsupported QR code",
          "This QR code is not a time-based authenticator setup code.",
        );
        setScanned(false);
        return;
      }

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

      const account: Account = {
        id: Date.now().toString() + "-" + Math.random().toString(36).slice(2),
        issuer: normalizedIssuer,
        name: normalizedName,
        secret: normalizedSecret,
        algorithm: algorithm as Account["algorithm"],
        digits: parsed.digits,
        period: parsed.period,
      };

      // Generate once to verify the parsed TOTP details before saving.
      const validationCode = generateCode(account);
      if (!/^\d+$/.test(validationCode)) {
        throw new Error("The QR code could not be validated.");
      }

      const duplicate = accounts.some(
        (existing) =>
          existing.issuer.toLowerCase() === account.issuer.toLowerCase() &&
          existing.name.toLowerCase() === account.name.toLowerCase(),
      );

      if (duplicate) {
        setScannerVisible(false);
        Alert.alert(
          "Account already added",
          `${account.issuer}: ${account.name} is already in KaalKey.`,
        );
        return;
      }

      const saved = await saveAccounts([...accounts, account]);

      if (saved) {
        hapticFeedback("success");
        setScannerVisible(false);
        Alert.alert(
          "Account added",
          `${account.issuer}: ${account.name} was added successfully.`,
        );
      } else {
        setScanned(false);
      }
    } catch {
      Alert.alert(
        "Invalid QR code",
        "KaalKey could not read this authenticator QR code. Try the service's TOTP setup QR code instead.",
      );
      setScanned(false);
    }
  }

  async function copyCode(code: string) {
    if (!/^\d{6}$/.test(code)) {
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

  function deleteAccount(id: string) {
    Alert.alert(
      "Remove account?",
      "This removes the account and its secret from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            hapticFeedback("warning");
            const updated = accounts.filter((account) => account.id !== id);

            void saveAccounts(updated);
          },
        },
      ],
    );
  }

  function openBackup(mode: "export" | "restore") {
    hapticFeedback("selection");
    setBackupMode(mode);
    setBackupPassword("");
    setBackupVisible(true);
  }

  async function exportEncryptedBackup() {
    if (backupPassword.length < 10) {
      Alert.alert("Use a stronger backup password", "Choose at least 10 characters. You will need this password to restore the backup.");
      return;
    }
    setBackupBusy(true);
    try {
      const encrypted = await encryptBackup(accounts, backupPassword);
      const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!base) throw new Error("A local file location is unavailable on this device.");
      const uri = `${base}kaalkey-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.kkbackup`;
      await FileSystem.writeAsStringAsync(uri, encrypted, { encoding: FileSystem.EncodingType.UTF8 });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Backup created", `Encrypted backup saved temporarily at:\n${uri}`);
      } else {
        await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Save your encrypted KaalKey backup", UTI: "public.json" });
      }
      setBackupVisible(false);
      setBackupPassword("");
    } catch (error) {
      Alert.alert("Backup failed", error instanceof Error ? error.message : "KaalKey could not create the backup.");
    } finally { setBackupBusy(false); }
  }

  async function restoreEncryptedBackup() {
    if (!backupPassword) {
      Alert.alert("Enter your backup password", "Enter the password used when this backup was created.");
      return;
    }
    setBackupBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ["application/json", "public.json", "*/*"], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets?.[0]) return;
      const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const restored = await decryptBackup(raw, backupPassword);
      Alert.alert(
        "Merge backup accounts?",
        `This backup contains ${restored.length} account${restored.length === 1 ? "" : "s"}. KaalKey will keep your existing accounts and add accounts from the backup that are not already present. Duplicate accounts will be skipped.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Merge accounts", onPress: () => { void (async () => {
            try {
              // Merge by account identity so restoring the same backup twice does not
              // create duplicates. Existing local accounts are retained unchanged.
              const identity = (account: Account) => [
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
              await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(merged));
              setAccounts(merged);
              setBackupVisible(false);
              setSettingsVisible(false);
              setBackupPassword("");
              Alert.alert(
                "Restore complete",
                `Added ${added} account${added === 1 ? "" : "s"}. ${restored.length - added} duplicate account${restored.length - added === 1 ? " was" : "s were"} skipped. Your existing accounts were kept.`
              );
            } catch { Alert.alert("Restore failed", "KaalKey could not save the restored accounts to secure storage."); }
          })(); } },
        ]
      );
    } catch (error) {
      Alert.alert("Restore failed", error instanceof Error ? error.message : "The backup could not be read.");
    } finally { setBackupBusy(false); }
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
  if (showBrandSplash) {
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
            <Text style={styles.splashKaal}>Kaal</Text><Text style={styles.splashK}>K</Text><Text style={styles.splashEy}>ey</Text>
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
            <Text style={[styles.securityButtonText, biometricEnabled && styles.securityButtonTextActive]}>
              {biometricEnabled ? "LOCK ON" : "SECURITY"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconButton}
            onPress={() => { hapticFeedback("selection"); setSettingsVisible(true); }}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Open app settings"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tricolorStripe}>
        <View
          style={[styles.tricolorSegment, { backgroundColor: "#FF9800" }]}
        />
        <View
          style={[styles.tricolorSegment, { backgroundColor: "#FFFFFF" }]}
        />
        <View
          style={[styles.tricolorSegment, { backgroundColor: "#138808" }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
                onPress={() => { hapticFeedback("selection"); setSortBy("service"); }}
                accessibilityRole="button"
                accessibilityLabel="Sort by service name"
              >
                <Text style={[styles.sortButtonText, sortBy === "service" && styles.sortButtonTextActive]}>Service</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === "account" && styles.sortButtonActive]}
                onPress={() => { hapticFeedback("selection"); setSortBy("account"); }}
                accessibilityRole="button"
                accessibilityLabel="Sort by account name"
              >
                <Text style={[styles.sortButtonText, sortBy === "account" && styles.sortButtonTextActive]}>Account</Text>
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
              Add an account using its secret key to generate your first
              verification code.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openAddAccount}
            >
              <Text style={styles.primaryButtonText}>
                Add your first account
              </Text>
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
                    accessibilityLabel={
                      "Copy verification code for " + account.issuer
                    }
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

          <Text style={styles.footerText}>
            Your codes. Your device. Your control.
          </Text>

          <Text style={styles.version}>EARLY DEVELOPMENT BUILD · 0.1.0</Text>
        </View>
      </ScrollView>

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
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalTitle}>{editingId ? "Edit account" : "Add account"}</Text>

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
                <Text style={styles.manualEntryLabel}>
                  OR ENTER DETAILS MANUALLY
                </Text>
              )}

              <Text style={styles.inputLabel}>SERVICE / ISSUER</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Google"
                placeholderTextColor="#66738A"
                value={issuer}
                onChangeText={setIssuer}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>ACCOUNT NAME</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. you@example.com"
                placeholderTextColor="#66738A"
                value={accountName}
                onChangeText={setAccountName}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>SECRET KEY (BASE32)</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your setup key"
                placeholderTextColor="#66738A"
                value={secret}
                onChangeText={setSecret}
                autoCapitalize="characters"
                autoCorrect={false}
                secureTextEntry
              />

              <Text style={styles.securityNote}>
                Use the secret key supplied by the service you are configuring.
                Never enter your account password here.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => void saveAccount()}
              >
                <Text style={styles.primaryButtonText}>
                  {editingId
                    ? "Save changes securely"
                    : "Save account securely"}
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
        <View style={styles.scannerContainer}>
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
              Point your camera at the authenticator setup QR code from the
              service you are adding.
            </Text>
          </View>

          <View style={styles.cameraFrame}>
            {scannerVisible && cameraPermission?.granted ? (
              <CameraView
                style={styles.cameraPreview}
                facing="back"
                mode="picture"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={
                  scanned ? undefined : ({ data }) => void handleQrScanned(data)
                }
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
            <Text style={styles.scannerManualText}>
              Enter details manually instead
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={[styles.settingsBackdrop, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 16 }]}>
          <View style={styles.settingsSheet}>
            <ScrollView
              style={styles.settingsScroll}
              contentContainerStyle={styles.settingsScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            <View style={styles.settingsTopRow}>
              <View>
                <Text style={styles.settingsEyebrow}>KAALKEY PREFERENCES</Text>
                <Text style={styles.settingsTitle}>App settings</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsCloseButton}
                onPress={() => setSettingsVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close settings"
              >
                <Text style={styles.settingsCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsSectionLabel}>EXPERIENCE</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}><Text style={styles.settingIcon}>📳</Text></View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitleText}>Haptic feedback</Text>
                <Text style={styles.settingDescription}>Gentle feedback for taps and completed actions.</Text>
              </View>
              <TouchableOpacity
                style={[styles.settingSwitch, hapticsEnabled && styles.settingSwitchOn]}
                onPress={() => void toggleHaptics()}
                accessibilityRole="switch"
                accessibilityState={{ checked: hapticsEnabled }}
                accessibilityLabel="Haptic feedback"
              >
                <View style={[styles.settingSwitchThumb, hapticsEnabled && styles.settingSwitchThumbOn]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsSectionLabel}>SECURITY</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}><Text style={styles.settingIcon}>🔐</Text></View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitleText}>Device authentication lock</Text>
                <Text style={styles.settingDescription}>{biometricEnabled ? "Your vault locks when KaalKey leaves the foreground." : "Require your phone’s biometrics or screen-lock PIN, pattern, or password."}</Text>
              </View>
              <TouchableOpacity
                style={[styles.settingSwitch, biometricEnabled && styles.settingSwitchOn]}
                onPress={() => void toggleBiometricLock()}
                accessibilityRole="switch"
                accessibilityState={{ checked: biometricEnabled }}
                accessibilityLabel="Device authentication app lock"
              >
                <View style={[styles.settingSwitchThumb, biometricEnabled && styles.settingSwitchThumbOn]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsSectionLabel}>BACKUP & RECOVERY</Text>
            <View style={styles.backupButtonsRow}>
              <TouchableOpacity style={styles.backupActionButton} onPress={() => openBackup("export")} activeOpacity={0.82}>
                <Text style={styles.backupActionIcon}>⬆</Text>
                <Text style={styles.backupActionTitle}>Create backup</Text>
                <Text style={styles.backupActionDescription}>Encrypted file</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backupActionButton} onPress={() => openBackup("restore")} activeOpacity={0.82}>
                <Text style={styles.backupActionIcon}>⬇</Text>
                <Text style={styles.backupActionTitle}>Restore backup</Text>
                <Text style={styles.backupActionDescription}>Import file</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.backupSafetyText}>Backups contain your authenticator secrets. They are encrypted with a password you choose. Keep that password safe; KaalKey cannot recover it.</Text>

            <Text style={styles.settingsSectionLabel}>APPEARANCE</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}><Text style={styles.settingIcon}>☀️</Text></View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitleText}>Light appearance</Text>
                <Text style={styles.settingDescription}>KaalKey currently uses its clean light theme.</Text>
              </View>
              <View style={styles.appearanceBadge}><Text style={styles.appearanceBadgeText}>ACTIVE</Text></View>
            </View>

            <View style={styles.settingsPrivacyNote}>
              <Text style={styles.settingsPrivacyIcon}>🛡️</Text>
              <Text style={styles.settingsPrivacyText}>Your authenticator secrets stay in the on-device secure vault. Preferences are stored locally.</Text>
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

      <Modal visible={backupVisible} transparent animationType="slide" onRequestClose={() => { setBackupVisible(false); setBackupPassword(""); }}>
        <View style={styles.settingsBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backupModalWrap}>
            <View style={styles.backupModal}>
              <View style={styles.settingsTopRow}>
                <View>
                  <Text style={styles.settingsEyebrow}>SECURE VAULT</Text>
                  <Text style={styles.settingsTitle}>{backupMode === "export" ? "Create backup" : "Restore backup"}</Text>
                </View>
                <TouchableOpacity style={styles.settingsCloseButton} onPress={() => { setBackupVisible(false); setBackupPassword(""); }} accessibilityLabel="Close backup" accessibilityRole="button">
                  <Text style={styles.settingsCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.backupModalDescription}>
                {backupMode === "export" ? `Encrypt all ${accounts.length} saved account${accounts.length === 1 ? "" : "s"} into a backup file. Choose a strong password and store the file somewhere private.` : "Choose your KaalKey backup file and password. New accounts will be added to your existing account list; existing accounts will stay as they are."}
              </Text>
              <Text style={styles.inputLabel}>BACKUP PASSWORD</Text>
              <TextInput style={styles.input} value={backupPassword} onChangeText={setBackupPassword} placeholder={backupMode === "export" ? "At least 10 characters" : "Enter backup password"} placeholderTextColor="#8290A7" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" />
              {backupMode === "export" && <Text style={styles.backupSafetyText}>Use a unique password with at least 10 characters. If you lose it, the backup cannot be decrypted.</Text>}
              <TouchableOpacity style={[styles.primaryButton, backupBusy && styles.backupDisabled]} disabled={backupBusy} onPress={() => void (backupMode === "export" ? exportEncryptedBackup() : restoreEncryptedBackup())}>
                <Text style={styles.primaryButtonText}>{backupBusy ? "Please wait…" : backupMode === "export" ? "Encrypt and share backup" : "Choose file and import"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setBackupVisible(false); setBackupPassword(""); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}


