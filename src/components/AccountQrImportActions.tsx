import { useAppLanguage } from "../i18n";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  onScan: () => Promise<void>;
  onImportImage: () => Promise<void>;
  onPasteImage: () => Promise<void>;
};

/** QR camera, gallery, and clipboard import actions. */
export default function AccountQrImportActions({ onScan, onImportImage, onPasteImage }: Props) {
  const { t } = useAppLanguage();
  return (
    <>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => void onScan()}
        accessibilityRole="button"
        accessibilityLabel={t("addAccount.scanAuthenticatorQr")}
      >
        <Text style={styles.scanButtonIcon}>▦</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>{t("addAccount.scanQrCode2")}</Text>
          <Text style={styles.scanButtonSubtitle}>{t("addAccount.cameraAddAccount")}</Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.scanButton, styles.importQrButton]}
        onPress={() => void onImportImage()}
        accessibilityRole="button"
        accessibilityLabel={t("addAccount.uploadQrImage")}
      >
        <Text style={styles.scanButtonIcon}>▧</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>{t("addAccount.uploadQrImage2")}</Text>
          <Text style={styles.scanButtonSubtitle}>{t("addAccount.chooseQrScreenshot")}</Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.scanButton, styles.importQrButton]}
        onPress={() => void onPasteImage()}
        accessibilityRole="button"
      >
        <Text style={styles.scanButtonIcon}>▣</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>{t("addAccount.pasteQr")}</Text>
          <Text style={styles.scanButtonSubtitle}>{t("addAccount.pasteCopiedQr")}</Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>
    </>
  );
}
