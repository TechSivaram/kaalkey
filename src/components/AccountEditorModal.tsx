import type { Dispatch, SetStateAction } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from "react-native";
import type { Account } from "../types/account";
import AccountImportActions from "./AccountImportActions";
import AccountManualEntryFields from "./AccountManualEntryFields";
import AccountEditorHeader from "./AccountEditorHeader";
import AccountEditorFooter from "./AccountEditorFooter";
import { styles } from "../styles/home.styles";

type Props = {
  modalVisible: boolean;
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
export default function AccountEditorModal(props: Props) {
  const {
    modalVisible,
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
