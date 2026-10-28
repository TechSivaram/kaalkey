import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { decodeQrPixels } from "../services/qr-image-decoder";
import jpeg from "jpeg-js";
import { decodeBase64ToBytes } from "../services/base64";
import {
  QR_IMAGE_MAX_WIDTH,
  QR_IMAGE_SMALL_SOURCE_THRESHOLD,
  QR_IMAGE_SMALL_SOURCE_SCALE,
  QR_IMAGE_LARGE_SOURCE_SCALE,
  QR_IMAGE_ALTERNATE_SCALE,
  QR_IMAGE_HIGH_SCALE,
  QR_IMAGE_CROP_RATIO,
} from "../constants/qr";

type UseQrImageImportOptions = {
  onQrScanned: (data: string, fromCamera?: boolean) => Promise<void>;
  modalVisible: boolean;
  editingId: string | null;
  setActivityMessage: (message: string | null) => void;
};

export function useQrImageImport({
  onQrScanned,
  modalVisible,
  editingId,
  setActivityMessage,
}: UseQrImageImportOptions) {
  const onQrScannedRef = useRef(onQrScanned);

  useEffect(() => {
    onQrScannedRef.current = onQrScanned;
  });

  function showQrImportMessage(title: string, message: string) {
    // React Native Alert is not consistently rendered on web. Use the browser
    // dialog there so failures never appear to do nothing.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  }

  async function importQrImage() {
    try {
      if (Platform.OS === "web") {
        // Use the browser's native file picker; no image is uploaded anywhere.
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
        // Keep the picker attached to the DOM. Some browsers silently ignore
        // click() on a detached file input, which looked like upload did nothing.
        input.style.position = "fixed";
        input.style.left = "-10000px";
        input.style.width = "1px";
        input.style.height = "1px";
        document.body.appendChild(input);
        input.oncancel = () => {
          input.remove();
        };
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            input.remove();
            return;
          }
          if (!file.type.startsWith("image/")) {
            showQrImportMessage("Unsupported file", "Choose a QR code image such as PNG or JPEG.");
            return;
          }
          let objectUrl: string | undefined;
          setActivityMessage("Reading QR image…");
          try {
            // Decode via a canvas + jsQR so web import works in browsers that do
            // not implement the experimental BarcodeDetector API.
            objectUrl = URL.createObjectURL(file);
            // React Native's `Image` import shadows the browser constructor on web.
            // Resolve the native browser image explicitly so the canvas decoder receives
            // a real HTMLImageElement.
            const BrowserImage = globalThis.Image;
            if (!BrowserImage) {
              throw new Error("Browser image decoding is unavailable");
            }
            const image = new BrowserImage();
            await new Promise<void>((resolve, reject) => {
              image.onload = () => {
                resolve();
              };
              image.onerror = () => {
                reject(new Error("Image could not be loaded"));
              };
              image.src = objectUrl!;
            });
            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            if (!sourceWidth || !sourceHeight) throw new Error("Image has no readable dimensions");

            // Try the browser-native QR decoder first where supported. It is an
            // optional fast path only; jsQR remains the fallback on all browsers.
            let qrText: string | undefined;
            const Detector = (
              globalThis as typeof globalThis & {
                BarcodeDetector?: new (options?: { formats?: string[] }) => {
                  detect(
                    source: HTMLImageElement | HTMLCanvasElement,
                  ): Promise<{ rawValue?: string }[]>;
                };
              }
            ).BarcodeDetector;
            if (Detector) {
              try {
                const detected = await new Detector({ formats: ["qr_code"] }).detect(image);
                qrText = detected.find((item) => item.rawValue)?.rawValue;
              } catch {
                // Some browsers expose BarcodeDetector but cannot decode this file.
              }
            }

            // QR codes embedded in screenshots are often small relative to the
            // full image. Try original, enlarged (for small QR modules), and
            // reduced (for very large screenshots) renderings.
            const scales = [
              1,
              sourceWidth < QR_IMAGE_SMALL_SOURCE_THRESHOLD &&
              sourceHeight < QR_IMAGE_SMALL_SOURCE_THRESHOLD
                ? QR_IMAGE_SMALL_SOURCE_SCALE
                : QR_IMAGE_LARGE_SOURCE_SCALE,
              QR_IMAGE_ALTERNATE_SCALE,
              QR_IMAGE_HIGH_SCALE,
            ];
            for (const scale of scales) {
              if (qrText) break;
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(sourceWidth * scale));
              canvas.height = Math.max(1, Math.round(sourceHeight * scale));
              const context = canvas.getContext("2d", { willReadFrequently: true });
              if (!context) continue;
              context.imageSmoothingEnabled = scale < 1;
              context.drawImage(image, 0, 0, canvas.width, canvas.height);
              const decodeCanvas = (left: number, top: number, width: number, height: number) => {
                const pixels = context.getImageData(left, top, width, height);
                return decodeQrPixels(pixels.data, pixels.width, pixels.height);
              };
              qrText = decodeCanvas(0, 0, canvas.width, canvas.height);
              if (qrText) break;
              // Try the center and four overlapping quadrants for screenshots where
              // the QR occupies only part of the image. Crops are read from the
              // already scaled canvas, so they remain local and avoid extra uploads.
              const cropWidth = Math.max(1, Math.round(canvas.width * QR_IMAGE_CROP_RATIO));
              const cropHeight = Math.max(1, Math.round(canvas.height * QR_IMAGE_CROP_RATIO));
              const positions = [
                [
                  Math.round((canvas.width - cropWidth) / 2),
                  Math.round((canvas.height - cropHeight) / 2),
                ],
                [0, 0],
                [canvas.width - cropWidth, 0],
                [0, canvas.height - cropHeight],
                [canvas.width - cropWidth, canvas.height - cropHeight],
              ];
              for (const [left, top] of positions) {
                qrText = decodeCanvas(Math.max(0, left), Math.max(0, top), cropWidth, cropHeight);
                if (qrText) break;
              }
            }
            if (!qrText) {
              showQrImportMessage(
                "No QR code found",
                "KaalKey could not decode a QR code in this image. Try a screenshot or a higher-resolution PNG/JPEG.",
              );
              return;
            }
            await onQrScanned(qrText, false);
          } catch {
            showQrImportMessage(
              "Could not read image",
              "Try a clear PNG or JPEG image containing the authenticator setup QR code.",
            );
          } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            input.remove();
            setActivityMessage(null);
          }
        };
        // Must be called directly within the user's click gesture.
        try {
          input.click();
        } catch {
          input.remove();
          showQrImportMessage("Could not open image picker", "Please try Upload QR again.");
        }
        return;
      }

      // Use the native photo-library picker on Android/iOS. Expo Camera in this
      // SDK version does not expose scanFromURLAsync, so decode a normalized JPEG
      // locally with jpeg-js + jsQR instead of calling a removed API.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setActivityMessage("Importing QR image…");
      const imageUri = result.assets[0].uri;

      let normalizedUri: string | undefined;
      try {
        const normalized = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: QR_IMAGE_MAX_WIDTH } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        normalizedUri = normalized.uri;
        const base64 = await FileSystem.readAsStringAsync(normalized.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const bytes = decodeBase64ToBytes(base64);
        const decodedImage = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
        if (!decodedImage.width || !decodedImage.height || !decodedImage.data?.length) {
          throw new Error("Normalized image could not be decoded");
        }

        // jsQR works directly on RGBA pixel data. Retry the full image at several
        // scales and on the center crop, which helps with small QR codes.
        let qrData: string | undefined;
        const attempts = [
          { data: decodedImage.data, width: decodedImage.width, height: decodedImage.height },
        ];
        const centerX = Math.floor(decodedImage.width * 0.1);
        const centerY = Math.floor(decodedImage.height * 0.1);
        const centerWidth = Math.max(1, decodedImage.width - centerX * 2);
        const centerHeight = Math.max(1, decodedImage.height - centerY * 2);
        if (centerWidth < decodedImage.width || centerHeight < decodedImage.height) {
          const crop = new Uint8ClampedArray(centerWidth * centerHeight * 4);
          for (let row = 0; row < centerHeight; row++) {
            const from = ((centerY + row) * decodedImage.width + centerX) * 4;
            crop.set(
              decodedImage.data.subarray(from, from + centerWidth * 4),
              row * centerWidth * 4,
            );
          }
          attempts.push({ data: new Uint8Array(crop), width: centerWidth, height: centerHeight });
        }
        for (const attempt of attempts) {
          const qrDataFromPixels = decodeQrPixels(
            new Uint8ClampedArray(attempt.data),
            attempt.width,
            attempt.height,
          );
          if (qrDataFromPixels) {
            qrData = qrDataFromPixels;
            break;
          }
        }
        if (!qrData) {
          showQrImportMessage(
            "No QR code found",
            "KaalKey decoded the selected image but did not find a QR code. Try a clear, full-resolution PNG or JPEG with the entire code visible.",
          );
          return;
        }
        await onQrScanned(qrData, false);
      } catch {
        showQrImportMessage(
          "Could not read image",
          "KaalKey could not decode this image. Try a PNG or JPEG screenshot with the full QR code visible.",
        );
      } finally {
        if (normalizedUri) {
          try {
            await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
          } catch {
            // Cache cleanup is best-effort.
          }
        }
      }
    } catch {
      showQrImportMessage(
        "QR image import failed",
        "KaalKey could not read that image. Please try another QR code image.",
      );
    } finally {
      if (Platform.OS !== "web") setActivityMessage(null);
    }
  }

  async function pasteQrImage() {
    try {
      if (Platform.OS === "web") {
        showQrImportMessage(
          "Paste a QR image",
          "Click this screen and press Ctrl+V (Windows/Linux) or ⌘+V (Mac) after copying a QR image.",
        );
        return;
      }
      const image = await Clipboard.getImageAsync({ format: "png" });
      if (!image?.data) {
        showQrImportMessage(
          "No image in clipboard",
          "Copy a QR code image, then tap Paste QR Image again.",
        );
        return;
      }
      setActivityMessage("Importing pasted QR image…");
      const extension = "png"; // getImageAsync({ format: "png" }) returns PNG base64 data.
      const sourceUri = `${FileSystem.cacheDirectory}kaalkey-clipboard-${Date.now()}.${extension}`;
      let normalizedUri: string | undefined;
      try {
        await FileSystem.writeAsStringAsync(sourceUri, image.data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const normalized = await ImageManipulator.manipulateAsync(
          sourceUri,
          [{ resize: { width: QR_IMAGE_MAX_WIDTH } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        normalizedUri = normalized.uri;
        const base64 = await FileSystem.readAsStringAsync(normalized.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const decodedImage = jpeg.decode(decodeBase64ToBytes(base64), {
          useTArray: true,
          formatAsRGBA: true,
        });
        const qrData = decodeQrPixels(
          new Uint8ClampedArray(decodedImage.data),
          decodedImage.width,
          decodedImage.height,
        );
        if (!qrData) {
          showQrImportMessage(
            "No QR code found",
            "The copied image does not contain a readable QR code.",
          );
          return;
        }
        await onQrScanned(qrData, false);
      } finally {
        try {
          await FileSystem.deleteAsync(sourceUri, { idempotent: true });
        } catch {}
        if (normalizedUri) {
          try {
            await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
          } catch {}
        }
        setActivityMessage(null);
      }
    } catch {
      setActivityMessage(null);
      showQrImportMessage(
        "Could not paste image",
        "Image pasting is not supported by this clipboard on this device. Use Import QR image instead.",
      );
    }
  }

  useEffect(() => {
    if (Platform.OS !== "web" || !modalVisible || editingId) return;
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        setActivityMessage("Importing pasted QR image…");
        const image = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) throw new Error("Image processing unavailable");
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrData = decodeQrPixels(pixels.data, pixels.width, pixels.height);
            if (qrData) void onQrScannedRef.current(qrData, false);
            else
              showQrImportMessage(
                "No QR code found",
                "The pasted image does not contain a readable QR code.",
              );
          } catch {
            showQrImportMessage(
              "Could not read pasted image",
              "Try copying a clear PNG or JPEG image containing the full QR code.",
            );
          } finally {
            URL.revokeObjectURL(objectUrl);
            setActivityMessage(null);
          }
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          setActivityMessage(null);
          showQrImportMessage("Could not read pasted image", "Try a different QR image.");
        };
        image.src = objectUrl;
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [modalVisible, editingId, setActivityMessage]);

  return { importQrImage, pasteQrImage };
}
