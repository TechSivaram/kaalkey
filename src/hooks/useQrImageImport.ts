import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import { Camera } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { decodeQrPixels } from "../services/qr-image-decoder";
import jpeg from "jpeg-js";
import { decodeBase64ToBytes } from "../services/base64";
import { QR_IMAGE_MAX_WIDTH } from "../constants/qr";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../utils/totpQrPayload";

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

            // Keep the fallback bounded: normalized full image, center crop, and at
            // most one alternate scale. The former 4-scale × 6-region loop could
            // trigger up to 24 jsQR attempts after BarcodeDetector failed.
            const maxDimension = 1800;
            const sourceMaxDimension = Math.max(sourceWidth, sourceHeight);
            const baseScale = Math.min(1, maxDimension / sourceMaxDimension);
            const primaryScale = sourceMaxDimension < 900 ? 1.5 : baseScale;
            const decodeAtScale = (scale: number, cropCenter = false) => {
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(sourceWidth * scale));
              canvas.height = Math.max(1, Math.round(sourceHeight * scale));
              const context = canvas.getContext("2d", { willReadFrequently: true });
              if (!context) return undefined;
              context.imageSmoothingEnabled = scale < 1;
              context.drawImage(image, 0, 0, canvas.width, canvas.height);
              const left = cropCenter ? Math.floor(canvas.width * 0.14) : 0;
              const top = cropCenter ? Math.floor(canvas.height * 0.14) : 0;
              const width = Math.max(1, canvas.width - left * 2);
              const height = Math.max(1, canvas.height - top * 2);
              const pixels = context.getImageData(left, top, width, height);
              return decodeQrPixels(pixels.data, pixels.width, pixels.height);
            };
            if (!qrText) qrText = decodeAtScale(primaryScale);
            if (!qrText) qrText = decodeAtScale(primaryScale, true);
            if (!qrText) {
              const alternateScale = primaryScale < 1 ? 1 : 0.75;
              if (alternateScale !== primaryScale) qrText = decodeAtScale(alternateScale);
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

      // Use the native photo-library picker on Android/iOS. Ask Expo Camera's
      // native image scanner to decode the picked URI before falling back to the
      // JavaScript JPEG/Base64/RGBA pipeline.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setActivityMessage("Importing QR image…");
      const imageUri = result.assets[0].uri;

      // Native image scanning avoids copying the image through Base64 and
      // decoding its pixels in JavaScript. Expo Camera supports this on Android
      // and iOS; if it fails or finds no QR, retain the existing fallback.
      try {
        const nativeResults = await Camera.scanFromURLAsync(imageUri, ["qr"]);
        const nativeQr = nativeResults.find((item) => item.data)?.data;
        if (nativeQr) {
          await onQrScanned(nativeQr, false);
          setActivityMessage(null);
          return;
        }
      } catch {
        // Native image decoding may fail for unsupported image formats/URIs.
      }

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
      // Clipboard may contain either an authenticator setup URL or a QR image.
      // Prefer text when it is a supported otpauth URI; otherwise continue to image.
      if (Platform.OS !== "web") {
        const clipboardText = (await Clipboard.getStringAsync()).trim();
        if (/^otpauth:\/\/totp\//i.test(clipboardText)) {
          await onQrScannedRef.current(clipboardText, false);
          return;
        }
      }
      if (Platform.OS === "web") {
        // Clipboard.read() is required here: readText() cannot retrieve a copied
        // QR screenshot. This button is invoked from a user gesture, so browsers
        // that permit clipboard access can return text/plain or image/* items.
        let clipboardText = "";
        let clipboardImage: Blob | undefined;
        try {
          const clipboardItems = await navigator.clipboard?.read?.();
          for (const item of clipboardItems ?? []) {
            if (!clipboardText && item.types.includes("text/plain")) {
              clipboardText = (await (await item.getType("text/plain")).text()).trim();
            }
            if (!clipboardImage) {
              const imageType = item.types.find((type) => type.startsWith("image/"));
              if (imageType) clipboardImage = await item.getType(imageType);
            }
          }
        } catch {
          // Some browsers expose readText but deny read() or image clipboard
          // access. Try text-only access before reporting a permission failure.
        }
        if (!clipboardText) {
          try {
            clipboardText = ((await navigator.clipboard?.readText?.()) ?? "").trim();
          } catch {
            clipboardText = "";
          }
        }
        const normalizedText = normalizeTotpQrPayload(clipboardText);
        if (clipboardText && isTotpQrPayload(normalizedText)) {
          setActivityMessage("Importing authenticator account…");
          await onQrScannedRef.current(normalizedText, false);
          return;
        }

        if (clipboardImage) {
          setActivityMessage("Importing pasted QR image…");
          let objectUrl: string | undefined;
          try {
            const BrowserImage = globalThis.Image;
            if (!BrowserImage) throw new Error("Browser image decoding is unavailable");
            objectUrl = URL.createObjectURL(clipboardImage);
            const image = new BrowserImage();
            await new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = () => reject(new Error("Clipboard image could not be loaded"));
              image.src = objectUrl!;
            });
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) throw new Error("Image processing is unavailable");
            context.drawImage(image, 0, 0);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const qrData = decodeQrPixels(pixels.data, pixels.width, pixels.height);
            if (!qrData) {
              showQrImportMessage(
                "No QR code found",
                "The copied image does not contain a readable QR code.",
              );
              return;
            }
            await onQrScannedRef.current(qrData, false);
            return;
          } catch {
            showQrImportMessage(
              "Could not paste image",
              "The copied image could not be decoded. Try copying a clear QR screenshot.",
            );
            return;
          } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            setActivityMessage(null);
          }
        }

        showQrImportMessage(
          "Clipboard unavailable",
          clipboardText
            ? "Clipboard text is not a valid authenticator setup URL. Copy an otpauth:// URL or QR image and try again."
            : "KaalKey could not read text or an image from the clipboard. Allow clipboard access, then copy the QR image or otpauth:// URL and tap Paste QR Image / URL again.",
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
      // Let normal paste behavior work inside the manual URL field and other
      // editable controls. Only the Add Account screen itself should auto-import
      // clipboard content when Ctrl+V is used outside an editor.
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, [contenteditable='true']"))
      ) {
        return;
      }

      const clipboard = event.clipboardData;
      if (!clipboard) return;

      // Browser paste events expose text and images separately. Handle an
      // authenticator setup URL first so Ctrl+V works for copied otpauth links
      // as well as QR screenshots.
      const pastedText = clipboard.getData("text/plain").trim();
      const normalizedText = normalizeTotpQrPayload(pastedText);
      if (pastedText && isTotpQrPayload(normalizedText)) {
        event.preventDefault();
        setActivityMessage("Importing authenticator account…");
        void onQrScannedRef.current(normalizedText, false).finally(() => {
          setActivityMessage(null);
        });
        return;
      }

      const items = clipboard.items;
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
