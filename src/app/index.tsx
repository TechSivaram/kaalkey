import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import CryptoJS from "crypto-js";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as OTPAuth from "otpauth";
import { SafeAreaView } from "react-native-safe-area-context";

type Account = {
  id: string;
  issuer: string;
  name: string;
  secret: string;
  algorithm: "SHA1" | "SHA256" | "SHA512";
  digits: number;
  period: number;
};

const STORAGE_KEY = "kaalkey_accounts_v1";
const BIOMETRIC_ENABLED_KEY = "kaalkey_biometric_lock_enabled_v1";
const HAPTICS_ENABLED_KEY = "kaalkey_haptics_enabled_v1";
const BACKUP_FORMAT = "kaalkey-encrypted-backup";
const BACKUP_VERSION = 1;
const BACKUP_KDF_ITERATIONS = 250000;
let hapticsAreEnabled = true;

// Lightweight haptic-style feedback using React Native's built-in vibration API.
// This avoids adding a native dependency and works in the current Expo Go setup.
function hapticFeedback(kind: "selection" | "success" | "warning" = "selection") {
  if (!hapticsAreEnabled) return;
  try {
    if (Platform.OS === "android") {
      const pattern =
        kind === "success"
          ? [0, 22, 45, 28]
          : kind === "warning"
            ? [0, 38, 55, 38]
            : 12;
      Vibration.vibrate(pattern);
    } else if (Platform.OS === "ios") {
      // iOS maps this to the system vibration; custom patterns are Android-only.
      Vibration.vibrate(kind === "success" ? 35 : kind === "warning" ? 45 : 15);
    }
  } catch {
    // Feedback is optional; never interrupt an account action if unavailable.
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex);
}

function validateAccounts(value: unknown): value is Account[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) =>
    item && typeof item === "object" &&
    typeof item.id === "string" && typeof item.issuer === "string" &&
    typeof item.name === "string" && typeof item.secret === "string" &&
    ["SHA1", "SHA256", "SHA512"].includes(item.algorithm) &&
    Number.isInteger(item.digits) && item.digits >= 6 && item.digits <= 8 &&
    Number.isInteger(item.period) && item.period >= 1 && item.period <= 120
  );
}

async function encryptBackup(accounts: Account[], password: string): Promise<string> {
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const iv = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const key = CryptoJS.PBKDF2(password, hexToWordArray(salt), {
    keySize: 256 / 32, iterations: BACKUP_KDF_ITERATIONS, hasher: CryptoJS.algo.SHA256,
  });
  const encryptionKey = CryptoJS.lib.WordArray.create(key.words.slice(0, 8), 32);
  const macKey = CryptoJS.PBKDF2(password, hexToWordArray(salt + "01"), {
    keySize: 256 / 32, iterations: BACKUP_KDF_ITERATIONS, hasher: CryptoJS.algo.SHA256,
  });
  const plaintext = JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: new Date().toISOString(), accounts });
  const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey, { iv: hexToWordArray(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  const authenticated = `${BACKUP_FORMAT}.${BACKUP_VERSION}.${salt}.${iv}.${ciphertext}`;
  const mac = CryptoJS.HmacSHA256(authenticated, macKey).toString(CryptoJS.enc.Hex);
  return JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, kdf: "PBKDF2-SHA256", iterations: BACKUP_KDF_ITERATIONS, salt, iv, ciphertext, mac }, null, 2);
}

async function decryptBackup(raw: string, password: string): Promise<Account[]> {
  const envelope = JSON.parse(raw);
  if (!envelope || envelope.format !== BACKUP_FORMAT || envelope.version !== BACKUP_VERSION || envelope.kdf !== "PBKDF2-SHA256" || envelope.iterations !== BACKUP_KDF_ITERATIONS || typeof envelope.salt !== "string" || !/^[a-f0-9]{32}$/i.test(envelope.salt) || typeof envelope.iv !== "string" || !/^[a-f0-9]{32}$/i.test(envelope.iv) || typeof envelope.ciphertext !== "string" || typeof envelope.mac !== "string") {
    throw new Error("This is not a supported KaalKey encrypted backup.");
  }
  const macKey = CryptoJS.PBKDF2(password, hexToWordArray(envelope.salt + "01"), { keySize: 256 / 32, iterations: BACKUP_KDF_ITERATIONS, hasher: CryptoJS.algo.SHA256 });
  const authenticated = `${BACKUP_FORMAT}.${BACKUP_VERSION}.${envelope.salt}.${envelope.iv}.${envelope.ciphertext}`;
  const expectedMac = CryptoJS.HmacSHA256(authenticated, macKey).toString(CryptoJS.enc.Hex);
  if (expectedMac.length !== envelope.mac.length || !CryptoJS.enc.Hex.parse(expectedMac).toString() || expectedMac.toLowerCase() !== envelope.mac.toLowerCase()) {
    throw new Error("Backup password is incorrect or the backup file has been modified.");
  }
  const key = CryptoJS.PBKDF2(password, hexToWordArray(envelope.salt), { keySize: 256 / 32, iterations: BACKUP_KDF_ITERATIONS, hasher: CryptoJS.algo.SHA256 });
  const decrypted = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(envelope.ciphertext) } as CryptoJS.lib.CipherParams, key, { iv: hexToWordArray(envelope.iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  const text = decrypted.toString(CryptoJS.enc.Utf8);
  if (!text) throw new Error("Backup password is incorrect or the file is damaged.");
  const payload = JSON.parse(text);
  if (payload?.format !== BACKUP_FORMAT || payload?.version !== BACKUP_VERSION || !validateAccounts(payload.accounts)) {
    throw new Error("The backup contents are invalid or incomplete.");
  }
  return payload.accounts;
}

function generateCode(account: Account): string {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.name,
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
      secret: account.secret,
    });

    return totp.generate();
  } catch {
    return "------";
  }
}

type CountdownRingProps = {
  secondsRemaining: number;
  period: number;
};

function CountdownRing({ secondsRemaining, period }: CountdownRingProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = secondsRemaining / Math.max(1, period);
  const countdownColor = secondsRemaining <= 5 ? "#D94841" : "#138808";

  useEffect(() => {
    pulse.setValue(0.94);
    Animated.timing(pulse, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [secondsRemaining, pulse]);

  return (
    <Animated.View
      style={[styles.countdownRing, { transform: [{ scale: pulse }] }]}
      accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
    >
      {Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
        const radius = 23;
        const segmentProgress = Math.max(0, Math.min(1, progress * 24 - index));
        return (
          <View
            key={index}
            style={[
              styles.countdownDot,
              {
                left: 27 + Math.cos(angle) * radius - 2,
                top: 27 + Math.sin(angle) * radius - 2,
                backgroundColor: segmentProgress > 0 ? countdownColor : "#CBD3DE",
                opacity: segmentProgress > 0 ? 0.35 + segmentProgress * 0.65 : 0.58,
                transform: [{ scale: segmentProgress > 0 ? 0.82 + segmentProgress * 0.18 : 0.82 }],
              },
            ]}
          />
        );
      })}
      <Animated.Text
        style={[
          styles.countdownNumber,
          { color: secondsRemaining <= 5 ? "#D94841" : "#172033" },
        ]}
      >
        {secondsRemaining}
      </Animated.Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
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
        const shouldEnable = enabled === "true";
        setBiometricEnabled(shouldEnable);
        setIsUnlocked(!shouldEnable);
      } catch {
        if (mounted) {
          setBiometricEnabled(false);
          setIsUnlocked(true);
        }
      } finally {
        if (mounted) setBiometricReady(true);
      }
    }

    void loadBiometricPreference();
    return () => { mounted = false; };
  }, []);

  async function authenticateUser(promptMessage = "Unlock KaalKey Authenticator") {
    if (authenticatingRef.current) return false;
    authenticatingRef.current = true;
    setAuthenticating(true);
    try {
      const hardwareAvailable = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hardwareAvailable || !enrolled) {
        Alert.alert(
          "Biometrics unavailable",
          "Set up a fingerprint or face unlock in your phone's security settings, then try again."
        );
        return false;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        biometricsSecurityLevel: "strong",
      });
      if (result.success) {
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch {
      Alert.alert("Authentication unavailable", "KaalKey could not start biometric authentication. Please try again.");
      return false;
    } finally {
      authenticatingRef.current = false;
      setAuthenticating(false);
    }
  }

  async function toggleBiometricLock() {
    if (biometricEnabled) {
      const authenticated = await authenticateUser("Confirm to turn off KaalKey lock");
      if (!authenticated) return;
      try {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false");
        setBiometricEnabled(false);
        setIsUnlocked(true);
        Alert.alert("App lock disabled", "Biometric lock has been turned off.");
      } catch {
        Alert.alert("Could not save setting", "Please try again.");
      }
      return;
    }

    const hardwareAvailable = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardwareAvailable || !enrolled) {
      Alert.alert(
        "Set up biometrics first",
        "Your phone needs an enrolled fingerprint or face unlock before KaalKey can enable app lock. Open your phone's Settings and set up biometrics first."
      );
      return;
    }

    const authenticated = await authenticateUser("Enable biometric lock for KaalKey");
    if (!authenticated) return;
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setBiometricEnabled(true);
      setIsUnlocked(true);
      Alert.alert("Biometric lock enabled", "KaalKey will ask for authentication when opened and when you return to it.");
    } catch {
      Alert.alert("Could not save setting", "Biometric lock could not be enabled. Please try again.");
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
        "Replace authenticator accounts?",
        `This backup contains ${restored.length} account${restored.length === 1 ? "" : "s"}. Restoring replaces all accounts currently on this device. Export a backup of your current vault first if you want to keep it.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Restore backup", style: "destructive", onPress: () => { void (async () => {
            try {
              await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(restored));
              setAccounts(restored);
              setBackupVisible(false);
              setSettingsVisible(false);
              setBackupPassword("");
              Alert.alert("Restore complete", `${restored.length} account${restored.length === 1 ? " was" : "s were"} restored securely.`);
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
            accessibilityLabel={biometricEnabled ? "Disable biometric app lock" : "Enable biometric app lock"}
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
          style={[styles.tricolorSegment, { backgroundColor: "#FF9933" }]}
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
                <View>
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
                  accessibilityRole="button"
                  accessibilityLabel="Close account form"
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
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsSheet}>
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
                <Text style={styles.settingTitleText}>Biometric app lock</Text>
                <Text style={styles.settingDescription}>{biometricEnabled ? "Your vault locks when KaalKey leaves the foreground." : "Require fingerprint or face authentication to open your vault."}</Text>
              </View>
              <TouchableOpacity
                style={[styles.settingSwitch, biometricEnabled && styles.settingSwitchOn]}
                onPress={() => void toggleBiometricLock()}
                accessibilityRole="switch"
                accessibilityState={{ checked: biometricEnabled }}
                accessibilityLabel="Biometric app lock"
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
                {backupMode === "export" ? `Encrypt all ${accounts.length} saved account${accounts.length === 1 ? "" : "s"} into a backup file. Choose a strong password and store the file somewhere private.` : "Choose your KaalKey .kkbackup file, then enter the password used to encrypt it. Restoring replaces the accounts on this device."}
              </Text>
              <Text style={styles.inputLabel}>BACKUP PASSWORD</Text>
              <TextInput style={styles.input} value={backupPassword} onChangeText={setBackupPassword} placeholder={backupMode === "export" ? "At least 10 characters" : "Enter backup password"} placeholderTextColor="#8290A7" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" />
              {backupMode === "export" && <Text style={styles.backupSafetyText}>Use a unique password with at least 10 characters. If you lose it, the backup cannot be decrypted.</Text>}
              <TouchableOpacity style={[styles.primaryButton, backupBusy && styles.backupDisabled]} disabled={backupBusy} onPress={() => void (backupMode === "export" ? exportEncryptedBackup() : restoreEncryptedBackup())}>
                <Text style={styles.primaryButtonText}>{backupBusy ? "Please wait…" : backupMode === "export" ? "Encrypt and share backup" : "Choose file and restore"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setBackupVisible(false); setBackupPassword(""); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {biometricReady && biometricEnabled && !isUnlocked && (
        <View style={styles.lockScreen}>
          <View style={styles.lockCard}>
            <View style={styles.lockIconCircle}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>
            <Text style={styles.lockBrand}>KaalKey</Text>
            <Text style={styles.lockTitle}>Your vault is protected</Text>
            <Text style={styles.lockDescription}>
              Verify your identity to access your one-time verification codes.
            </Text>
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => void authenticateUser()}
              disabled={authenticating}
              activeOpacity={0.82}
            >
              <Text style={styles.unlockButtonText}>
                {authenticating ? "Waiting for verification…" : "Unlock with biometrics"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.lockFootnote}>Your secrets stay stored on this device.</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  settingsIconButton: {
    width: 38,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 22, color: "#263449", fontWeight: "700" },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "flex-end",
  },
  settingsSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderWidth: 1,
    borderColor: "#E5EAF1",
  },
  settingsTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  settingsEyebrow: { fontSize: 10, letterSpacing: 1.8, fontWeight: "800", color: "#138808", marginBottom: 5 },
  settingsTitle: { fontSize: 26, fontWeight: "900", color: "#172033" },
  settingsCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F4F8", alignItems: "center", justifyContent: "center" },
  settingsCloseText: { fontSize: 16, fontWeight: "800", color: "#344054" },
  settingsSectionLabel: { color: "#7A8698", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 9, marginTop: 8 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#EEF1F5", gap: 12 },
  settingIconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F3F6FA", alignItems: "center", justifyContent: "center" },
  settingIcon: { fontSize: 20 },
  settingCopy: { flex: 1 },
  settingTitleText: { fontSize: 14, fontWeight: "800", color: "#172033", marginBottom: 3 },
  settingDescription: { fontSize: 11, lineHeight: 16, color: "#697586" },
  settingSwitch: { width: 46, height: 27, borderRadius: 14, backgroundColor: "#D7DDE6", padding: 3, justifyContent: "center" },
  settingSwitchOn: { backgroundColor: "#138808" },
  settingSwitchThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#FFFFFF", elevation: 2, alignSelf: "flex-start" },
  settingSwitchThumbOn: { alignSelf: "flex-end" },
  appearanceBadge: { borderRadius: 8, backgroundColor: "#EAF8EE", paddingHorizontal: 9, paddingVertical: 6 },
  appearanceBadgeText: { fontSize: 9, fontWeight: "900", color: "#138808", letterSpacing: 0.6 },
  backupButtonsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  backupActionButton: { flex: 1, minHeight: 106, borderRadius: 15, borderWidth: 1, borderColor: "#DCE5F0", backgroundColor: "#FFFFFF", padding: 13, alignItems: "flex-start", justifyContent: "center" },
  backupActionIcon: { fontSize: 21, color: "#138808", marginBottom: 7, fontWeight: "800" },
  backupActionTitle: { color: "#17243A", fontSize: 13, fontWeight: "800" },
  backupActionDescription: { color: "#77859A", fontSize: 11, marginTop: 4 },
  backupSafetyText: { color: "#7B5B24", fontSize: 11, lineHeight: 16, marginTop: 9 },
  backupModalWrap: { flex: 1, justifyContent: "flex-end" },
  backupModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30, borderWidth: 1, borderColor: "#E7EDF5" },
  backupModalDescription: { color: "#5E6C82", fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  backupDisabled: { opacity: 0.6 },

  settingsPrivacyNote: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 22, padding: 13, backgroundColor: "#F5F8FC", borderRadius: 14, borderWidth: 1, borderColor: "#E7EDF5" },
  settingsPrivacyIcon: { fontSize: 20 },
  settingsPrivacyText: { flex: 1, color: "#596579", fontSize: 11, lineHeight: 16 },
  settingsDoneButton: { marginTop: 18, borderRadius: 15, backgroundColor: "#172033", paddingVertical: 15, alignItems: "center" },
  settingsDoneText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },

  tricolorStripe: {
    height: 3,
    flexDirection: "row",
  },

  tricolorSegment: {
    flex: 1,
  },

  securityButton: {
    minWidth: 66,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#F8FAFC",
  },
  securityButtonActive: {
    borderColor: "#B7E3C2",
    backgroundColor: "#EFFAF1",
  },
  securityButtonIcon: {
    fontSize: 17,
    marginBottom: 3,
  },
  securityButtonText: {
    color: "#526075",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  securityButtonTextActive: {
    color: "#138808",
  },
  lockScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  lockCard: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E1E6ED",
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 28,
  },
  lockIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#FFF2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  lockIcon: { fontSize: 34 },
  lockBrand: {
    color: "#172033",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 10,
  },
  lockTitle: {
    color: "#172033",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  lockDescription: {
    color: "#657186",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  unlockButton: {
    width: "100%",
    backgroundColor: "#F28C00",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  unlockButtonText: {
    color: "#101827",
    fontSize: 13,
    fontWeight: "900",
  },
  lockFootnote: {
    color: "#8290A7",
    fontSize: 10,
    marginTop: 18,
    textAlign: "center",
  },

  header: {
    paddingTop: 8,
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EAF0",
  },

  brandRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  brandMarkFrame: {
    width: 88,
    height: 82,
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMark: {
    width: "100%",
    height: "100%",
  },

  brandTextBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  brandName: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  brandKaal: {
    color: "#F28C00",
  },

  brandK: {
    color: "#1769E0",
  },

  brandEy: {
    color: "#168A35",
  },

  brandSubtitle: {
    marginTop: 1,
    marginBottom: 7,
    color: "#4B5563",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.1,
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D8E1EA",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
  },

  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#138808",
  },

  secureText: {
    color: "#516074",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 48,
  },

  intro: {
    marginTop: 4,
    marginBottom: 26,
    padding: 21,
    paddingTop: 22,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#26344A",
    backgroundColor: "#101A2B",
    overflow: "hidden",
  },

  eyebrow: {
    color: "#FF9933",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 11,
  },

  heading: {
    color: "#F4F6FB",
    fontSize: 37,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1.4,
  },

  description: {
    color: "#A0AEC2",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 11,
    maxWidth: 300,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  organizePanel: {
    marginBottom: 16,
  },

  searchInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#FFFFFF",
    color: "#172033",
    paddingHorizontal: 14,
    fontSize: 13,
  },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  sortLabel: {
    color: "#778397",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginRight: 3,
  },

  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DCE2EA",
    backgroundColor: "#FFFFFF",
  },

  sortButtonActive: {
    borderColor: "#F28C00",
    backgroundColor: "#FFF3E5",
  },

  sortButtonText: {
    color: "#596579",
    fontSize: 11,
    fontWeight: "700",
  },

  sortButtonTextActive: {
    color: "#B95D00",
  },

  accountActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editButton: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCE2EA",
  },

  editButtonText: {
    color: "#4E5A6D",
    fontSize: 11,
    fontWeight: "700",
  },

  sectionTitle: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  accountCount: {
    color: "#778397",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  addButton: {
    backgroundColor: "#F28C00",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 13,
    shadowColor: "#C96D00",
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  addButtonText: {
    color: "#101827",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: "#E1E6ED",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFF0DD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyIconText: {
    color: "#FF9933",
    fontSize: 30,
  },

  emptyTitle: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 9,
  },

  emptyText: {
    color: "#657186",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: "#F28C00",
    borderRadius: 14,
    minHeight: 51,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 21,
    shadowColor: "#C96D00",
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  primaryButtonText: {
    color: "#101827",
    fontSize: 14,
    fontWeight: "800",
  },

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E6EE",
    borderRadius: 20,
    padding: 16,
    marginBottom: 13,
    shadowColor: "#18263B",
    shadowOpacity: 0.075,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFF0DD",
    borderWidth: 1,
    borderColor: "#F5D4AD",
    alignItems: "center",
    justifyContent: "center",
  },

  accountIconText: {
    color: "#B95D00",
    fontSize: 20,
    fontWeight: "900",
  },

  accountInfo: {
    flex: 1,
  },

  accountIssuer: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
  },

  accountName: {
    color: "#68758A",
    fontSize: 12,
    marginTop: 4,
  },

  deleteIcon: {
    color: "#8A95A6",
    fontSize: 28,
    paddingHorizontal: 5,
  },

  codeRow: {
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8ECF2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  codeArea: {
    flex: 1,
    minWidth: 0,
  },

  countdownRing: {
    width: 56,
    height: 56,
    marginLeft: 12,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#F0F4F8",
  },

  countdownDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  countdownNumber: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  code: {
    color: "#172033",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 3,
    fontVariant: ["tabular-nums"],
  },

  copyHint: {
    color: "#B95D00",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 8,
  },

  footer: {
    marginTop: 37,
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E0E6EE",
  },

  footerBrand: {
    color: "#566276",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  footerText: {
    color: "#7A8597",
    fontSize: 12,
    marginTop: 9,
  },

  version: {
    color: "#98A1AF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 15,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 29, 47, 0.45)",
    justifyContent: "center",
    padding: 16,
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0E6EE",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  modalTitle: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#68758A",
    fontSize: 12,
    marginTop: 7,
  },

  closeButton: {
    color: "#647086",
    fontSize: 30,
    paddingHorizontal: 5,
  },

  inputLabel: {
    color: "#566276",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 9,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DCE2EA",
    borderRadius: 11,
    color: "#172033",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },

  securityNote: {
    color: "#68758A",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 15,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8F3",
    borderColor: "#C8E2CE",
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    marginBottom: 19,
    gap: 12,
  },

  scanButtonIcon: {
    color: "#FF9933",
    fontSize: 28,
    fontWeight: "800",
  },

  scanButtonCopy: {
    flex: 1,
  },

  scanButtonTitle: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "800",
  },

  scanButtonSubtitle: {
    color: "#68758A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  scanButtonArrow: {
    color: "#FF9933",
    fontSize: 28,
  },

  manualEntryLabel: {
    color: "#7A8597",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 2,
    marginBottom: 3,
  },

  scannerContainer: {
    flex: 1,
    backgroundColor: "#080D18",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 42 : 58,
    paddingBottom: 28,
  },

  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scannerBack: {
    color: "#FF9933",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 8,
  },

  scannerStep: {
    color: "#8290A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
  },

  scannerIntro: {
    marginTop: 28,
    marginBottom: 24,
  },

  scannerTitle: {
    color: "#F5F7FC",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  scannerSubtitle: {
    color: "#8E9BB0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  cameraFrame: {
    width: "100%",
    height: 330,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#314451",
    backgroundColor: "#111B2B",
  },

  cameraPreview: {
    width: "100%",
    height: "100%",
  },

  cameraUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#111B2B",
  },

  cameraUnavailableText: {
    color: "#D5DCE8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  scanCornerTL: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FF9933",
    borderTopLeftRadius: 9,
  },

  scanCornerTR: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FF9933",
    borderTopRightRadius: 9,
  },

  scanCornerBL: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FF9933",
    borderBottomLeftRadius: 9,
  },

  scanCornerBR: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FF9933",
    borderBottomRightRadius: 9,
  },

  scannerHint: {
    color: "#8290A7",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 18,
  },

  scannerManualButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 10,
  },

  scannerManualText: {
    color: "#FF9933",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#68758A",
    fontSize: 13,
    fontWeight: "700",
  },
});
