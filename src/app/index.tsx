import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
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

export default function HomeScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
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

  async function addAccount() {
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
      const totp = new OTPAuth.TOTP({
        issuer: normalizedIssuer,
        label: normalizedName,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: normalizedSecret,
      });

      // Validate the supplied Base32 secret.
      totp.generate();

      const account: Account = {
        id: Date.now().toString() + "-" + Math.random().toString(36).slice(2),

        issuer: normalizedIssuer,
        name: normalizedName,
        secret: normalizedSecret,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      };

      const saved = await saveAccounts([...accounts, account]);

      if (saved) {
        setIssuer("");
        setAccountName("");
        setSecret("");
        setModalVisible(false);
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
            const updated = accounts.filter((account) => account.id !== id);

            void saveAccounts(updated);
          },
        },
      ],
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
            <Text style={styles.brandName}><Text style={styles.brandKaal}>Kaal</Text><Text style={styles.brandK}>K</Text><Text style={styles.brandEy}>ey</Text></Text>
            <Text style={styles.brandSubtitle}>AUTHENTICATOR</Text>
            <View style={styles.secureBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.secureText}>LOCAL VAULT</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tricolorStripe}>
        <View style={[styles.tricolorSegment, { backgroundColor: "#FF9933" }]} />
        <View style={[styles.tricolorSegment, { backgroundColor: "#FFFFFF" }]} />
        <View style={[styles.tricolorSegment, { backgroundColor: "#138808" }]} />
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
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add account"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

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
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.primaryButtonText}>
                Add your first account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map((account) => {
            const code = generateCode(account);
            const period = Math.max(1, account.period || 30);
            const elapsed = now > 0 ? (now / 1000) % period : 0;
            const secondsRemaining = Math.max(1, Math.ceil(period - elapsed));
            const progress = secondsRemaining / period;
            const countdownColor = secondsRemaining <= 5 ? "#FF8A8A" : "#138808";
            const ringSegments = Array.from({ length: 24 }, (_, index) => {
              const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
              const radius = 23;
              const segmentActive = index < Math.ceil(progress * 24);
              return {
                key: index,
                left: 27 + Math.cos(angle) * radius - 2,
                top: 27 + Math.sin(angle) * radius - 2,
                active: segmentActive,
              };
            });

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

                  <TouchableOpacity
                    onPress={() => deleteAccount(account.id)}
                    accessibilityRole="button"
                    accessibilityLabel={"Remove " + account.issuer + " account"}
                  >
                    <Text style={styles.deleteIcon}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.codeRow}>
                  <TouchableOpacity
                    style={styles.codeArea}
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

                  <View
                    style={styles.countdownRing}
                    accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
                  >
                    {ringSegments.map((segment) => (
                      <View
                        key={segment.key}
                        style={[
                          styles.countdownDot,
                          {
                            left: segment.left,
                            top: segment.top,
                            backgroundColor: segment.active ? countdownColor : "#344155",
                            opacity: segment.active ? 1 : 0.7,
                          },
                        ]}
                      />
                    ))}
                    <Text
                      style={[
                        styles.countdownNumber,
                        { color: secondsRemaining <= 5 ? "#FF8A8A" : "#F4F6FB" },
                      ]}
                    >
                      {secondsRemaining}
                    </Text>
                  </View>
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
        onRequestClose={() => setModalVisible(false)}
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
                  <Text style={styles.modalTitle}>Add account</Text>

                  <Text style={styles.modalSubtitle}>
                    Scan a QR code for the easiest setup, or enter details manually.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close add account form"
                >
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

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

              <Text style={styles.manualEntryLabel}>OR ENTER DETAILS MANUALLY</Text>

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
                onPress={() => void addAccount()}
              >
                <Text style={styles.primaryButtonText}>
                  Save account securely
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
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
              Point your camera at the authenticator setup QR code from the service you are adding.
            </Text>
          </View>

          <View style={styles.cameraFrame}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanned ? undefined : ({ data }) => void handleQrScanned(data)}
            />
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  tricolorStripe: {
    height: 3,
    flexDirection: "row",
  },

  tricolorSegment: {
    flex: 1,
  },

  header: {
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
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
    width: 104,
    height: 96,
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
    backgroundColor: "#FF9933",
  },

  secureText: {
    color: "#A8B5C8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
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

  sectionTitle: {
    color: "#F5F7FC",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  accountCount: {
    color: "#8290A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 5,
  },

  addButton: {
    backgroundColor: "#FF9933",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 13,
    shadowColor: "#FF9933",
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
    borderColor: "#253249",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#0D1524",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#1A2839",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyIconText: {
    color: "#FF9933",
    fontSize: 30,
  },

  emptyTitle: {
    color: "#F5F7FC",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 9,
  },

  emptyText: {
    color: "#8998AE",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: "#FF9933",
    borderRadius: 14,
    minHeight: 51,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 21,
    shadowColor: "#FF9933",
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
    backgroundColor: "#0F1929",
    borderWidth: 1,
    borderColor: "#26354B",
    borderRadius: 21,
    padding: 17,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
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
    backgroundColor: "#202F43",
    borderWidth: 1,
    borderColor: "#33445A",
    alignItems: "center",
    justifyContent: "center",
  },

  accountIconText: {
    color: "#FF9933",
    fontSize: 20,
    fontWeight: "900",
  },

  accountInfo: {
    flex: 1,
  },

  accountIssuer: {
    color: "#F4F6FB",
    fontSize: 14,
    fontWeight: "800",
  },

  accountName: {
    color: "#8D9BB0",
    fontSize: 12,
    marginTop: 4,
  },

  deleteIcon: {
    color: "#8390A4",
    fontSize: 28,
    paddingHorizontal: 5,
  },

  codeRow: {
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#26364B",
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
    backgroundColor: "#172437",
  },

  countdownDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  countdownNumber: {
    color: "#F4F6FB",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  code: {
    color: "#F4F6FB",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
  },

  copyHint: {
    color: "#FF9933",
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
    borderTopColor: "#1C2739",
  },

  footerBrand: {
    color: "#A8B5C8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  footerText: {
    color: "#68788F",
    fontSize: 12,
    marginTop: 9,
  },

  version: {
    color: "#536177",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 15,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
    justifyContent: "center",
    padding: 16,
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: "#101A2A",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#2A3850",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  modalTitle: {
    color: "#F4F6FB",
    fontSize: 24,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#8E9BB0",
    fontSize: 12,
    marginTop: 7,
  },

  closeButton: {
    color: "#B7C3D5",
    fontSize: 30,
    paddingHorizontal: 5,
  },

  inputLabel: {
    color: "#A5B3C7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 9,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#2B3950",
    borderRadius: 11,
    color: "#F5F7FC",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },

  securityNote: {
    color: "#8998AE",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 15,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2A32",
    borderColor: "#58734B",
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
    color: "#F5F7FC",
    fontSize: 15,
    fontWeight: "800",
  },

  scanButtonSubtitle: {
    color: "#A5B3C7",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  scanButtonArrow: {
    color: "#FF9933",
    fontSize: 28,
  },

  manualEntryLabel: {
    color: "#73839A",
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
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#314451",
    backgroundColor: "#111B2B",
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
    color: "#A6B3C7",
    fontSize: 13,
    fontWeight: "700",
  },
});
