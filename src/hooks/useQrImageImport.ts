import { isWeb } from "../platform/runtime";
import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useAppLanguage } from "../i18n";
import { createUserMessages } from "../constants/userMessages";
import { beginExternalActivity } from "../utils/externalActivity";
import { showUserMessage } from "../utils/user-message";
import {
  decodeNativeClipboardQrImage,
  decodeNativeQrImage,
} from "../services/native-qr-image-import";
import {
  decodeQrImageFile,
  getImageFileFromClipboard,
  getImageFileFromDrop,
  normalizeClipboardTotpText,
  readWebClipboard,
} from "../services/web-qr-image-import";
import { isTotpQrPayload } from "../utils/totpQrPayload";

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
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragEnterCountRef = useRef(0);

  useEffect(() => {
    onQrScannedRef.current = onQrScanned;
  }, [onQrScanned]);

  const showQrImportMessage = useCallback((title: string, message: string) => {
    showUserMessage(title, message);
  }, []);

  const importQrImage = useCallback(async () => {
    if (isWeb) {
      // Use the browser's native file picker; image data stays on-device.
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
      input.hidden = true;
      document.body.appendChild(input);
      input.oncancel = () => input.remove();
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
          input.remove();
          return;
        }

        setActivityMessage(USER_MESSAGES.activity.readingQrImage);
        try {
          const qrData = await decodeQrImageFile(file);
          if (!qrData) {
            showQrImportMessage(
              USER_MESSAGES.qrImport.noQrCodeFoundTitle,
              USER_MESSAGES.qrImport.noQrCodeFoundBody,
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

    const finishExternalActivity = beginExternalActivity();
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
    } catch {
      showQrImportMessage(
        USER_MESSAGES.qrImport.importFailedTitle,
        USER_MESSAGES.qrImport.importFailedBody,
      );
      return;
    } finally {
      finishExternalActivity();
    }
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setActivityMessage(USER_MESSAGES.activity.importingQrImage);
    try {
      const qrData = await decodeNativeQrImage(result.assets[0].uri);
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
      setActivityMessage(null);
    }
  }, [USER_MESSAGES, setActivityMessage, showQrImportMessage]);

  const pasteQrImage = useCallback(async () => {
    try {
      if (!isWeb) {
        const clipboardText = (await Clipboard.getStringAsync()).trim();
        if (isTotpQrPayload(clipboardText)) {
          await onQrScannedRef.current(clipboardText, false);
          return;
        }
      }

      if (isWeb) {
        const { text, image } = await readWebClipboard();
        const normalizedText = normalizeClipboardTotpText(text);
        if (normalizedText) {
          setActivityMessage(USER_MESSAGES.activity.importingAccount);
          await onQrScannedRef.current(normalizedText, false);
          return;
        }

        if (!image) {
          showQrImportMessage(
            USER_MESSAGES.qrImport.clipboardUnavailableTitle,
            text
              ? USER_MESSAGES.qrImport.clipboardUnavailableBody
              : USER_MESSAGES.qrImport.clipboardAccessBody,
          );
          return;
        }

        setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
        try {
          const qrData = await decodeQrImageFile(image);
          if (!qrData) {
            showQrImportMessage(
              USER_MESSAGES.qrImport.noQrCodeFoundTitle,
              USER_MESSAGES.qrImport.notFoundBody,
            );
            return;
          }
          await onQrScannedRef.current(qrData, false);
        } catch {
          showQrImportMessage(
            USER_MESSAGES.qrImport.couldNotPasteImageTitle,
            USER_MESSAGES.qrImport.sourceImageReadFailure,
          );
        } finally {
          setActivityMessage(null);
        }
        return;
      }

      setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      const qrData = await decodeNativeClipboardQrImage();
      if (!qrData) {
        showQrImportMessage(
          USER_MESSAGES.qrImport.noImageInClipboardTitle,
          USER_MESSAGES.qrImport.noImageInClipboardBody,
        );
        return;
      }
      await onQrScannedRef.current(qrData, false);
    } catch {
      showQrImportMessage(
        USER_MESSAGES.qrImport.couldNotPasteImageTitle,
        USER_MESSAGES.qrImport.couldNotPasteImageBody,
      );
    } finally {
      setActivityMessage(null);
    }
  }, [USER_MESSAGES, setActivityMessage, showQrImportMessage]);

  useEffect(() => {
    if (!isWeb || !modalVisible || editingId) return;

    const onPaste = (event: ClipboardEvent) => {
      // Preserve normal paste behavior in text fields and editable controls.
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, [contenteditable='true']"))
      ) {
        return;
      }

      const clipboard = event.clipboardData;
      if (!clipboard) return;

      const normalizedText = normalizeClipboardTotpText(clipboard.getData("text/plain").trim());
      if (normalizedText) {
        event.preventDefault();
        setActivityMessage(USER_MESSAGES.activity.importingAccount);
        void onQrScannedRef.current(normalizedText, false).finally(() => {
          setActivityMessage(null);
        });
        return;
      }

      const pastedImage = getImageFileFromClipboard(clipboard);
      if (!pastedImage) return;
      event.preventDefault();
      setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      void decodeQrImageFile(pastedImage)
        .then((qrData) => {
          if (qrData) {
            void onQrScannedRef.current(qrData, false);
          } else {
            showQrImportMessage(
              USER_MESSAGES.qrImport.noQrCodeFoundTitle,
              USER_MESSAGES.qrImport.pastedNotFoundBody,
            );
          }
        })
        .catch(() => {
          showQrImportMessage(
            USER_MESSAGES.qrImport.couldNotReadImageTitle,
            USER_MESSAGES.qrImport.pastedReadFailureBody,
          );
        })
        .finally(() => setActivityMessage(null));
    };

    const hasDraggedFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      dragEnterCountRef.current += 1;
      setIsDraggingImage(true);
    };

    const onDragOver = (event: DragEvent) => {
      // Prevent the browser from navigating to a dropped image file.
      const dataTransfer = event.dataTransfer;
      if (!dataTransfer || !hasDraggedFiles(event)) return;
      event.preventDefault();
      dataTransfer.dropEffect = "copy";
      setIsDraggingImage(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;
      dragEnterCountRef.current = Math.max(0, dragEnterCountRef.current - 1);
      if (dragEnterCountRef.current === 0) setIsDraggingImage(false);
    };

    const resetDragState = () => {
      dragEnterCountRef.current = 0;
      setIsDraggingImage(false);
    };

    const onDrop = (event: DragEvent) => {
      const dataTransfer = event.dataTransfer;
      resetDragState();
      if (!dataTransfer?.files.length) return;
      event.preventDefault();

      const droppedImage = getImageFileFromDrop(dataTransfer);
      if (!droppedImage) {
        showQrImportMessage(
          USER_MESSAGES.qrImport.unsupportedFileTitle,
          USER_MESSAGES.qrImport.unsupportedFileBody,
        );
        return;
      }

      setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      void decodeQrImageFile(droppedImage)
        .then((qrData) => {
          if (qrData) {
            void onQrScannedRef.current(qrData, false);
          } else {
            showQrImportMessage(
              USER_MESSAGES.qrImport.noQrCodeFoundTitle,
              USER_MESSAGES.qrImport.pastedNotFoundBody,
            );
          }
        })
        .catch(() => {
          showQrImportMessage(
            USER_MESSAGES.qrImport.couldNotReadImageTitle,
            USER_MESSAGES.qrImport.pastedReadFailureBody,
          );
        })
        .finally(() => setActivityMessage(null));
    };

    // Capture phase lets the Add Account flow receive files before nested handlers.
    window.addEventListener("paste", onPaste, true);
    window.addEventListener("dragenter", onDragEnter, true);
    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("dragleave", onDragLeave, true);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("dragend", resetDragState, true);
    return () => {
      window.removeEventListener("paste", onPaste, true);
      window.removeEventListener("dragenter", onDragEnter, true);
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("dragleave", onDragLeave, true);
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("dragend", resetDragState, true);
      resetDragState();
    };
  }, [modalVisible, editingId, setActivityMessage, showQrImportMessage, USER_MESSAGES]);

  return { importQrImage, pasteQrImage, isDraggingImage };
}
