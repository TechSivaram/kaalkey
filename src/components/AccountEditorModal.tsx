import { memo, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { Account } from "../types/account";
import AccountImportActions from "./AccountImportActions";
import AccountManualEntryFields from "./AccountManualEntryFields";
import AccountEditorHeader from "./AccountEditorHeader";
import AccountEditorFooter from "./AccountEditorFooter";
import { styles } from "../styles/home.styles";
import { getAccountEditorBackdropStyles } from "../styles/component.styles";

type Props = {
  modalVisible: boolean;
  isDraggingImage: boolean;
  setModalVisible: Dispatch<SetStateAction<boolean>>;
  editingId: string | null;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  issuer: string;
  setIssuer: Dispatch<SetStateAction<string>>;
  accountName: string;
  setAccountName: Dispatch<SetStateAction<string>>;
  secret: string;
  setSecret: Dispatch<SetStateAction<string>>;
  totpUrlInput: string;
  setTotpUrlInput: Dispatch<SetStateAction<string>>;
  manualExpanded: boolean;
  setManualExpanded: Dispatch<SetStateAction<boolean>>;
  otpAlgorithm: Account["algorithm"];
  setOtpAlgorithm: Dispatch<SetStateAction<Account["algorithm"]>>;
  otpDigits: number;
  setOtpDigits: Dispatch<SetStateAction<number>>;
  otpPeriod: string;
  setOtpPeriod: Dispatch<SetStateAction<string>>;
  insets: { top: number; bottom: number };
  openQrScanner: () => Promise<void>;
  importQrImage: () => Promise<void>;
  pasteQrImage: () => Promise<void>;
  importTotpUrl: (value: string) => Promise<void>;
  pasteTotpUrl: () => Promise<void>;
  saveAccount: () => Promise<void>;
};

/** Add/edit account dialog, including QR and TOTP-URL import entry points. */
function AccountEditorModal(props: Props) {
  const {
    modalVisible,
    isDraggingImage,
    setModalVisible,
    editingId,
    setEditingId,
    issuer,
    setIssuer,
    accountName,
    setAccountName,
    secret,
    setSecret,
    totpUrlInput,
    setTotpUrlInput,
    manualExpanded,
    setManualExpanded,
    otpAlgorithm,
    setOtpAlgorithm,
    otpDigits,
    setOtpDigits,
    otpPeriod,
    setOtpPeriod,
    insets,
    openQrScanner,
    importQrImage,
    pasteQrImage,
    importTotpUrl,
    pasteTotpUrl,
    saveAccount,
  } = props;
  const [dropOverlayOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (Platform.OS !== "web") return;
    Animated.timing(dropOverlayOpacity, {
      toValue: isDraggingImage ? 1 : 0,
      duration: isDraggingImage ? 160 : 120,
      useNativeDriver: true,
    }).start();
  }, [dropOverlayOpacity, isDraggingImage]);

  return (
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
        style={[styles.modalBackdrop, ...getAccountEditorBackdropStyles(insets)]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.modalScroll}
          showsVerticalScrollIndicator={false}
          persistentScrollbar={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalCard}>
            <AccountEditorHeader
              editingId={editingId}
              onClose={() => {
                setModalVisible(false);
                setEditingId(null);
              }}
            />

            <AccountImportActions
              editingId={editingId}
              totpUrlInput={totpUrlInput}
              setTotpUrlInput={setTotpUrlInput}
              manualExpanded={manualExpanded}
              setManualExpanded={setManualExpanded}
              openQrScanner={openQrScanner}
              importQrImage={importQrImage}
              pasteQrImage={pasteQrImage}
              importTotpUrl={importTotpUrl}
              pasteTotpUrl={pasteTotpUrl}
            />
            <AccountManualEntryFields
              editingId={editingId}
              manualExpanded={manualExpanded}
              issuer={issuer}
              setIssuer={setIssuer}
              accountName={accountName}
              setAccountName={setAccountName}
              secret={secret}
              setSecret={setSecret}
              otpAlgorithm={otpAlgorithm}
              setOtpAlgorithm={setOtpAlgorithm}
              otpDigits={otpDigits}
              setOtpDigits={setOtpDigits}
              otpPeriod={otpPeriod}
              setOtpPeriod={setOtpPeriod}
            />

            <AccountEditorFooter
              editingId={editingId}
              onSave={saveAccount}
              onCancel={() => {
                setModalVisible(false);
                setEditingId(null);
              }}
            />
          </View>
        </ScrollView>
        {Platform.OS === "web" && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 10000,
              opacity: dropOverlayOpacity,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingVertical: 32,
              backgroundColor: "rgba(15, 28, 23, 0.68)",
            }}
          >
            <Animated.View
              style={{
                width: "100%",
                maxWidth: 390,
                padding: 8,
                borderRadius: 22,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "rgba(190, 224, 203, 0.9)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                transform: [
                  {
                    scale: dropOverlayOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 30,
                  borderRadius: 15,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  style={{
                    width: 58,
                    height: 58,
                    marginBottom: 17,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#E8F1EB",
                    borderWidth: 1,
                    borderColor: "#D4E5D9",
                  }}
                >
                  <Text style={{ color: "#164C35", fontSize: 29, fontWeight: "600" }}>↥</Text>
                </View>
                <Text
                  style={{
                    color: "#142B23",
                    fontSize: 19,
                    fontWeight: "700",
                    letterSpacing: 0.1,
                    textAlign: "center",
                  }}
                >
                  Import QR code
                </Text>
                <Text
                  style={{
                    marginTop: 7,
                    color: "#66756D",
                    fontSize: 13,
                    lineHeight: 19,
                    textAlign: "center",
                  }}
                >
                  Drop your QR image here to add it to KaalKey
                </Text>
                <View
                  style={{
                    marginTop: 18,
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: "#F1F5F2",
                  }}
                >
                  <Text
                    style={{
                      color: "#53665A",
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1.1,
                    }}
                  >
                    PNG · JPG · WEBP
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default memo(AccountEditorModal);
