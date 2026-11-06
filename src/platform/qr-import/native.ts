import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { beginExternalActivity } from "../../utils/externalActivity";
import {
  decodeNativeClipboardQrImage,
  decodeNativeQrImage,
} from "../../services/native-qr-image-import";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../../utils/totpQrPayload";
import type { QrImportService } from "./types";

/** Shared native image picker and QR image decoder for Android and iOS. */
export const qrImport: QrImportService = {
  async pickImage() {
    const finishExternalActivity = beginExternalActivity();
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
    } finally {
      finishExternalActivity();
    }

    const uri = !result.canceled ? result.assets?.[0]?.uri : undefined;
    return uri ? { kind: "native", uri } : undefined;
  },

  async decodeImage(image) {
    if (image.kind !== "native") return undefined;
    return decodeNativeQrImage(image.uri);
  },

  async readClipboard(onImageFound) {
    const text = (await Clipboard.getStringAsync()).trim();
    if (isTotpQrPayload(normalizeTotpQrPayload(text))) {
      return { text, imageAvailable: false, source: "native" };
    }

    onImageFound?.();
    const qrData = await decodeNativeClipboardQrImage();
    return {
      text,
      qrData,
      // Native Expo Clipboard exposes decoded image data through this API;
      // an unavailable image and an undecodable image share the existing UI path.
      imageAvailable: Boolean(qrData),
      source: "native",
    };
  },

  subscribeToWebEvents() {
    return () => {};
  },
};
