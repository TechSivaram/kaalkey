import * as Clipboard from "expo-clipboard";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Camera } from "expo-camera";
import jpeg from "jpeg-js";
import { QR_IMAGE_MAX_WIDTH } from "../constants/qr";
import { decodeBase64ToBytes } from "./base64";
import { decodeQrPixels } from "./qr-image-decoder";

async function decodeNormalizedImage(uri: string): Promise<string | undefined> {
  let normalizedUri: string | undefined;
  try {
    const normalized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: QR_IMAGE_MAX_WIDTH } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
    );
    normalizedUri = normalized.uri;
    const base64 = await FileSystem.readAsStringAsync(normalized.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const decoded = jpeg.decode(decodeBase64ToBytes(base64), {
      useTArray: true,
      formatAsRGBA: true,
    });
    if (!decoded.width || !decoded.height || !decoded.data?.length) {
      throw new Error("Normalized image could not be decoded");
    }

    const fullImageQr = decodeQrPixels(decoded.data, decoded.width, decoded.height);
    if (fullImageQr) return fullImageQr;

    const cropX = Math.floor(decoded.width * 0.1);
    const cropY = Math.floor(decoded.height * 0.1);
    const cropWidth = Math.max(1, decoded.width - cropX * 2);
    const cropHeight = Math.max(1, decoded.height - cropY * 2);
    if (cropWidth >= decoded.width && cropHeight >= decoded.height) return undefined;

    const crop = new Uint8ClampedArray(cropWidth * cropHeight * 4);
    for (let row = 0; row < cropHeight; row++) {
      const sourceOffset = ((cropY + row) * decoded.width + cropX) * 4;
      crop.set(
        decoded.data.subarray(sourceOffset, sourceOffset + cropWidth * 4),
        row * cropWidth * 4,
      );
    }
    return decodeQrPixels(crop, cropWidth, cropHeight);
  } finally {
    if (normalizedUri) {
      try {
        await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
      } catch {
        // Cache cleanup is best-effort.
      }
    }
  }
}

/** Try Expo's native scanner first, then the JavaScript pixel decoder. */
export async function decodeNativeQrImage(uri: string): Promise<string | undefined> {
  try {
    const results = await Camera.scanFromURLAsync(uri, ["qr"]);
    const nativeQr = results.find((item) => item.data)?.data;
    if (nativeQr) return nativeQr;
  } catch {
    // Fall back for unsupported image formats or URI types.
  }
  return decodeNormalizedImage(uri);
}

/** Read and decode a clipboard image, cleaning up both temporary files. */
export async function decodeNativeClipboardQrImage(): Promise<string | undefined> {
  const image = await Clipboard.getImageAsync({ format: "png" });
  if (!image?.data) return undefined;

  const sourceUri = `${FileSystem.cacheDirectory}kaalkey-clipboard-${Date.now()}.png`;
  try {
    const imageBase64 = image.data.replace(/^data:image\/[^;]+;base64,/i, "");
    await FileSystem.writeAsStringAsync(sourceUri, imageBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return await decodeNormalizedImage(sourceUri);
  } finally {
    try {
      await FileSystem.deleteAsync(sourceUri, { idempotent: true });
    } catch {
      // Cache cleanup is best-effort.
    }
  }
}
