import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { Account } from "../types/account";
import { styles } from "../styles/home.styles";
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
  qrAccount, qrRevealed, setQrRevealed, insets, createAccountOtpAuthUrl, closeAccountQr,
}: Props) {
  return (
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
              backgroundColor: COLORS.white,
              borderRadius: 22,
              padding: 22,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.navy, fontSize: 21, fontWeight: "800", marginBottom: 8 }}>
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
                  backgroundColor={COLORS.white}
                  color="#111827"
                />
                <Text
                  style={{
                    color: COLORS.textMuted,
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
  );
}
