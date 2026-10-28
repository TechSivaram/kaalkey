import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { Account } from "../types/account";
import { styles as homeStyles } from "../styles/home.styles";
import { COLORS } from "../constants/colors";

type Props = {
  qrAccount: Account | null;
  qrRevealed: boolean;
  setQrRevealed: (value: boolean) => void;
  insets: { top: number; bottom: number };
  createAccountOtpAuthUrl: (account: Account) => string;
  closeAccountQr: () => void;
};

/** Confirmation and display dialog for exporting an account as a QR code. */
export default function AccountQrModal({
  qrAccount,
  qrRevealed,
  setQrRevealed,
  insets,
  createAccountOtpAuthUrl,
  closeAccountQr,
}: Props) {
  const overlayStyle = [
    styles.overlay,
    Platform.OS === "android" && {
      paddingTop: Math.max(insets.top + 22, 34),
      paddingBottom: Math.max(insets.bottom + 22, 34),
    },
  ];

  return (
    <Modal
      visible={qrAccount !== null}
      transparent
      animationType="fade"
      onRequestClose={closeAccountQr}
    >
      <View style={overlayStyle}>
        <View style={styles.card}>
          <Text style={styles.title}>Account QR code</Text>
          <Text style={styles.accountLabel}>
            {qrAccount?.issuer} · {qrAccount?.name}
          </Text>
          {!qrRevealed ? (
            <>
              <Text style={styles.warning}>
                Warning: anyone who scans this QR code can generate verification codes for this
                account. Only reveal it on a trusted screen.
              </Text>
              <TouchableOpacity
                style={[homeStyles.primaryButton, styles.fullWidth]}
                onPress={() => setQrRevealed(true)}
                accessibilityRole="button"
              >
                <Text style={homeStyles.primaryButtonText}>Reveal QR code</Text>
              </TouchableOpacity>
            </>
          ) : qrAccount ? (
            <>
              <QRCode
                value={createAccountOtpAuthUrl(qrAccount)}
                size={230}
                backgroundColor={COLORS.white}
                color="#111827"
              />
              <Text style={styles.privacyHint}>
                Keep this QR code private. Scanning it copies the account’s authenticator secret.
              </Text>
            </>
          ) : null}
          <TouchableOpacity
            style={[homeStyles.cancelButton, styles.closeButton]}
            onPress={closeAccountQr}
          >
            <Text style={homeStyles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 20, 38, 0.72)",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
  },
  title: {
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 8,
  },
  accountLabel: {
    color: "#53637A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  warning: {
    color: "#8A3B18",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 18,
  },
  fullWidth: {
    width: "100%",
  },
  privacyHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 12,
  },
  closeButton: {
    width: "100%",
    marginTop: 10,
  },
});
