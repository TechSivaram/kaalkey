import { Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { Account } from "../types/account";
import { styles as homeStyles } from "../styles/home.styles";
import {
  accountQrModalStyles as styles,
  getAccountQrOverlayStyles,
} from "../styles/component.styles";
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
  const overlayStyle = getAccountQrOverlayStyles(insets);

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
