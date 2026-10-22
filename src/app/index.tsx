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

// Lightweight haptic-style feedback using React Native's built-in vibration API.
// This avoids adding a native dependency and works in the current Expo Go setup.
function hapticFeedback(kind: "selection" | "success" | "warning" = "selection") {
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
