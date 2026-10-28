import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  onScan: () => Promise<void>;
  onImportImage: () => Promise<void>;
  onPasteImage: () => Promise<void>;
};

/** QR camera, gallery, and clipboard import actions. */
export default function AccountQrImportActions({ onScan, onImportImage, onPasteImage }: Props) {
  return (
    <>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => void onScan()}
        accessibilityRole="button"
        accessibilityLabel="Scan authenticator QR code"
      >
        <Text style={styles.scanButtonIcon}>▦</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>Scan QR code</Text>
          <Text style={styles.scanButtonSubtitle}>Use your camera to add an account instantly</Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.scanButton, styles.importQrButton]}
        onPress={() => void onImportImage()}
        accessibilityRole="button"
        accessibilityLabel="Import QR code image"
      >
        <Text style={styles.scanButtonIcon}>▧</Text>
        <View style={styles.scanButtonCopy}>
          <Text style={styles.scanButtonTitle}>Import QR image</Text>
          <Text style={styles.scanButtonSubtitle}>
            Choose a QR screenshot from Gallery, Photos, or Files
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
          <Text style={styles.scanButtonTitle}>Paste QR image</Text>
          <Text style={styles.scanButtonSubtitle}>Copy a QR image, then paste it here</Text>
        </View>
        <Text style={styles.scanButtonArrow}>›</Text>
      </TouchableOpacity>
    </>
  );
}
