import { useMemo, useEffect, useRef, useCallback } from "react";
import { useAppLanguage } from "../i18n";
import { Platform } from "react-native";
import { createUserMessages } from "../constants/userMessages";
import { showUserMessage } from "../utils/user-message";
import { Camera } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { beginExternalActivity } from "../utils/externalActivity";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { decodeQrPixels } from "../services/qr-image-decoder";
import jpeg from "jpeg-js";
import { decodeBase64ToBytes } from "../services/base64";
import { QR_IMAGE_MAX_WIDTH } from "../constants/qr";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../utils/totpQrPayload";

// Bound canvas memory for pasted screenshots while preserving native resolution
// for ordinary images. Large clipboard images otherwise allocate full-size RGBA
// buffers before jsQR begins decoding.
function decodeQrImageElement(image: HTMLImageElement): string | undefined {
  const maxDimension = 1800;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  if (!sourceWidth || !sourceHeight) return undefined;

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return undefined;
  context.imageSmoothingEnabled = scale < 1;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return decodeQrPixels(pixels.data, pixels.width, pixels.height);
}

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
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const onQrScannedRef = useRef(onQrScanned);

  useEffect(() => {
    onQrScannedRef.current = onQrScanned;
  }, [onQrScanned]);

  function showQrImportMessage(title: string, message: string) {
    showUserMessage(title, message);
  }

  const importQrImage = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        // Use the browser's native file picker; no image is uploaded anywhere.
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
        // Keep the picker attached to the DOM. Some browsers silently ignore
        // click() on a detached file input, which looked like upload did nothing.
        input.hidden = true;
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
            showQrImportMessage(
              USER_MESSAGES.qrImport.unsupportedFileTitle,
              USER_MESSAGES.qrImport.unsupportedFileBody,
            );
            return;
          }
          let objectUrl: string | undefined;
          setActivityMessage(USER_MESSAGES.activity.readingQrImage);
          try {
            // Decode via a canvas + jsQR so web import works in browsers that do
            // not implement the experimental BarcodeDetector API.
            objectUrl = URL.createObjectURL(file);
            // React Native's `Image` import shadows the browser constructor on web.
            // Resolve the native browser image explicitly so the canvas decoder receives
            // a real HTMLImageElement.
            const BrowserImage = globalThis.Image;
            if (!BrowserImage) {
              throw new Error(USER_MESSAGES.qrImport.browserDecoderUnavailable);
            }
            const image = new BrowserImage();
            await new Promise<void>((resolve, reject) => {
              image.onload = () => {
                resolve();
              };
              image.onerror = () => {
                reject(new Error(USER_MESSAGES.qrImport.imageLoadFailed));
              };
              image.src = objectUrl!;
            });
            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            if (!sourceWidth || !sourceHeight) {
              throw new Error(USER_MESSAGES.qrImport.unreadableDimensions);
            }

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
                USER_MESSAGES.qrImport.noQrCodeFoundTitle,
                USER_MESSAGES.qrImport.noQrCodeFoundBody,
              );
              return;
            }
            await onQrScannedRef.current(qrText, false);
          } catch {
            showQrImportMessage(
              USER_MESSAGES.qrImport.couldNotReadImageTitle,
              USER_MESSAGES.qrImport.couldNotReadImageBody,
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
          showQrImportMessage(
            USER_MESSAGES.qrImport.couldNotOpenPickerTitle,
            USER_MESSAGES.qrImport.couldNotOpenPickerBody,
          );
        }
        return;
      }

      // Use the native photo-library picker on Android/iOS. Ask Expo Camera's
      // native image scanner to decode the picked URI before falling back to the
      // JavaScript JPEG/Base64/RGBA pipeline.
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
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setActivityMessage(USER_MESSAGES.activity.importingQrImage);
      const imageUri = result.assets[0].uri;

      // Native image scanning avoids copying the image through Base64 and
      // decoding its pixels in JavaScript. Expo Camera supports this on Android
      // and iOS; if it fails or finds no QR, retain the existing fallback.
      try {
        const nativeResults = await Camera.scanFromURLAsync(imageUri, ["qr"]);
        const nativeQr = nativeResults.find((item) => item.data)?.data;
        if (nativeQr) {
          await onQrScannedRef.current(nativeQr, false);
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
          throw new Error(USER_MESSAGES.qrImport.normalizedDecodeFailed);
        }

        // jsQR works directly on RGBA pixel data. Retry the full image at several
        // scales and on the center crop, which helps with small QR codes.
        let qrData: string | undefined;
        const attempts: {
          data: Uint8Array | Uint8ClampedArray;
          width: number;
          height: number;
        }[] = [{ data: decodedImage.data, width: decodedImage.width, height: decodedImage.height }];
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
          attempts.push({ data: crop, width: centerWidth, height: centerHeight });
        }
        for (const attempt of attempts) {
          const qrDataFromPixels = decodeQrPixels(attempt.data, attempt.width, attempt.height);
          if (qrDataFromPixels) {
            qrData = qrDataFromPixels;
            break;
          }
        }
        if (!qrData) {
          showQrImportMessage(
            USER_MESSAGES.qrImport.noQrCodeFoundTitle,
            USER_MESSAGES.qrImport.noQrCodeTextBody,
          );
          return;
        }
        await onQrScannedRef.current(qrData, false);
      } catch {
        showQrImportMessage(
          USER_MESSAGES.qrImport.couldNotReadImageTitle,
          USER_MESSAGES.qrImport.couldNotReadImageBody,
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
        USER_MESSAGES.qrImport.importFailedTitle,
        USER_MESSAGES.qrImport.importFailedBody,
      );
    } finally {
      if (Platform.OS !== "web") setActivityMessage(null);
    }
  }, [USER_MESSAGES, setActivityMessage]);

  const pasteQrImage = useCallback(async () => {
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
          setActivityMessage(USER_MESSAGES.activity.importingAccount);
          await onQrScannedRef.current(normalizedText, false);
          return;
        }

        if (clipboardImage) {
          setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
          let objectUrl: string | undefined;
          try {
            const BrowserImage = globalThis.Image;
            if (!BrowserImage) {
              throw new Error(USER_MESSAGES.qrImport.browserDecoderUnavailable);
            }
            objectUrl = URL.createObjectURL(clipboardImage);
            const image = new BrowserImage();
            await new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = () =>
                reject(new Error(USER_MESSAGES.qrImport.clipboardImageLoadFailed));
              image.src = objectUrl!;
            });
            const qrData = decodeQrImageElement(image);
            if (!qrData && (!image.naturalWidth || !image.naturalHeight)) {
              throw new Error(USER_MESSAGES.qrImport.imageProcessingUnavailable);
            }
            if (!qrData) {
              showQrImportMessage(
                USER_MESSAGES.qrImport.noQrCodeFoundTitle,
                USER_MESSAGES.qrImport.notFoundBody,
              );
              return;
            }
            await onQrScannedRef.current(qrData, false);
            return;
          } catch {
            showQrImportMessage(
              USER_MESSAGES.qrImport.couldNotPasteImageTitle,
              USER_MESSAGES.qrImport.sourceImageReadFailure,
            );
            return;
          } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            setActivityMessage(null);
          }
        }

        showQrImportMessage(
          USER_MESSAGES.qrImport.clipboardUnavailableTitle,
          clipboardText
            ? USER_MESSAGES.qrImport.clipboardUnavailableBody
            : USER_MESSAGES.qrImport.clipboardAccessBody,
        );
        return;
      }
      const image = await Clipboard.getImageAsync({ format: "png" });
      if (!image?.data) {
        showQrImportMessage(
          USER_MESSAGES.qrImport.noImageInClipboardTitle,
          USER_MESSAGES.qrImport.noImageInClipboardBody,
        );
        return;
      }
      setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      const extension = "png"; // getImageAsync({ format: "png" }) returns PNG base64 data.
      const sourceUri = `${FileSystem.cacheDirectory}kaalkey-clipboard-${Date.now()}.${extension}`;
      let normalizedUri: string | undefined;
      try {
        // Expo Clipboard returns image data with a data-URI prefix
        // (for example, data:image/png;base64,...). FileSystem expects only
        // the Base64 payload when using the Base64 encoding option.
        const imageBase64 = image.data.replace(/^data:image\/[^;]+;base64,/i, "");
        await FileSystem.writeAsStringAsync(sourceUri, imageBase64, {
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
        const qrData = decodeQrPixels(decodedImage.data, decodedImage.width, decodedImage.height);
        if (!qrData) {
          showQrImportMessage(
            USER_MESSAGES.qrImport.noQrCodeFoundTitle,
            USER_MESSAGES.qrImport.notFoundBody,
          );
          return;
        }
        await onQrScannedRef.current(qrData, false);
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
        USER_MESSAGES.qrImport.couldNotPasteImageTitle,
        USER_MESSAGES.qrImport.couldNotPasteImageBody,
      );
    }
  }, [USER_MESSAGES, setActivityMessage]);

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
        setActivityMessage(USER_MESSAGES.activity.importingAccount);
        void onQrScannedRef.current(normalizedText, false).finally(() => {
          setActivityMessage(null);
        });
        return;
      }

      // ClipboardItem lists are the standard path. Some browsers expose copied
      // image data through clipboardData.files instead, so check both surfaces.
      let pastedImage: File | null = null;
      const items = clipboard.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.type.startsWith("image/")) continue;
          pastedImage = item.getAsFile();
          if (pastedImage) break;
        }
      }
      if (!pastedImage && clipboard.files?.length) {
        pastedImage =
          Array.from(clipboard.files).find((file) => file.type.startsWith("image/")) ?? null;
      }
      if (!pastedImage) return;

      event.preventDefault();
      setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      const image = document.createElement("img");
      const objectUrl = URL.createObjectURL(pastedImage);
      image.onload = () => {
        try {
          const qrData = decodeQrImageElement(image);
          if (!qrData && (!image.naturalWidth || !image.naturalHeight)) {
            throw new Error(USER_MESSAGES.qrImport.imageProcessingUnavailableAlt);
          }
          if (qrData) void onQrScannedRef.current(qrData, false);
          else
            showQrImportMessage(
              USER_MESSAGES.qrImport.noQrCodeFoundTitle,
              USER_MESSAGES.qrImport.pastedNotFoundBody,
            );
        } catch {
          showQrImportMessage(
            USER_MESSAGES.qrImport.couldNotReadImageTitle,
            USER_MESSAGES.qrImport.pastedReadFailureBody,
          );
        } finally {
          URL.revokeObjectURL(objectUrl);
          setActivityMessage(null);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setActivityMessage(null);
        showQrImportMessage(
          USER_MESSAGES.qrImport.couldNotReadImageTitle,
          USER_MESSAGES.qrImport.pastedImportFailureBody,
        );
      };
      image.src = objectUrl;
    };
    const onDragOver = (event: DragEvent) => {
      // Only claim file drags while the Add Account modal is active. This also
      // prevents the browser from navigating to the dropped image file.
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };

    const onDrop = (event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files?.length) return;
      event.preventDefault();

      const droppedImage = Array.from(files).find(
        (file) => file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name),
      );
      if (!droppedImage) {
        showQrImportMessage(
          USER_MESSAGES.qrImport.unsupportedFileTitle,
          USER_MESSAGES.qrImport.unsupportedFileBody,
        );
        return;
      }

      setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      const objectUrl = URL.createObjectURL(droppedImage);
      const image = new globalThis.Image();
      image.onload = () => {
        try {
          const qrData = decodeQrImageElement(image);
          if (!qrData && (!image.naturalWidth || !image.naturalHeight)) {
            throw new Error(USER_MESSAGES.qrImport.imageProcessingUnavailableAlt);
          }
          if (qrData) {
            void onQrScannedRef.current(qrData, false);
          } else {
            showQrImportMessage(
              USER_MESSAGES.qrImport.noQrCodeFoundTitle,
              USER_MESSAGES.qrImport.pastedNotFoundBody,
            );
          }
        } catch {
          showQrImportMessage(
            USER_MESSAGES.qrImport.couldNotReadImageTitle,
            USER_MESSAGES.qrImport.pastedReadFailureBody,
          );
        } finally {
          URL.revokeObjectURL(objectUrl);
          setActivityMessage(null);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setActivityMessage(null);
        showQrImportMessage(
          USER_MESSAGES.qrImport.couldNotReadImageTitle,
          USER_MESSAGES.qrImport.pastedImportFailureBody,
        );
      };
      image.src = objectUrl;
    };

    // Capture phase ensures the app receives files before nested React
    // components or browser widgets can stop these events from bubbling.
    window.addEventListener("paste", onPaste, true);
    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("drop", onDrop, true);
    return () => {
      window.removeEventListener("paste", onPaste, true);
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("drop", onDrop, true);
    };
  }, [modalVisible, editingId, setActivityMessage, USER_MESSAGES]);

  return { importQrImage, pasteQrImage };
}
