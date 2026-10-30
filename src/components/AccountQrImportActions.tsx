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
        accessibilityLabel={t("Scan authenticator QR code")}
      >
        <Text style={styles.scanButtonIcon}>▦</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>{t("Scan QR code")}</Text>
          <Text style={styles.scanButtonSubtitle}>
            {t("Use your camera to add an account instantly")}
          </Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.scanButton, styles.importQrButton]}
        onPress={() => void onImportImage()}
        accessibilityRole="button"
        accessibilityLabel={t("Upload QR image")}
      >
        <Text style={styles.scanButtonIcon}>▧</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>{t("Upload QR Image")}</Text>
          <Text style={styles.scanButtonSubtitle}>
            {t("Choose a QR screenshot from Gallery, Photos, or Files")}
          </Text>
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
          <Text style={styles.scanButtonTitle}>{t("Paste QR Image / URL")}</Text>
          <Text style={styles.scanButtonSubtitle}>
            {t("Paste a copied QR image or authenticator setup URL")}
          </Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>
    </>
  );
}
