import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { useAppLanguage } from "../i18n";
import { createUserMessages } from "../constants/userMessages";
import { showUserMessage } from "../utils/user-message";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../utils/totpQrPayload";
import { qrImport } from "../platform/qr-import/qr-import";
import type { QrImageSelection } from "../platform/qr-import/types";

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

  useEffect(() => {
    onQrScannedRef.current = onQrScanned;
  }, [onQrScanned]);

  const showQrImportMessage = useCallback((title: string, message: string) => {
    showUserMessage(title, message);
  }, []);

  const importQrImage = useCallback(async () => {
    let selection: QrImageSelection | undefined;
    try {
      selection = await qrImport.pickImage();
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "";
      if (errorCode === "unsupported_file") {
        showQrImportMessage(
          USER_MESSAGES.qrImport.unsupportedFileTitle,
          USER_MESSAGES.qrImport.unsupportedFileBody,
        );
      } else if (errorCode === "picker_unavailable") {
        showQrImportMessage(
          USER_MESSAGES.qrImport.couldNotOpenPickerTitle,
          USER_MESSAGES.qrImport.couldNotOpenPickerBody,
        );
      } else {
        showQrImportMessage(
          USER_MESSAGES.qrImport.importFailedTitle,
          USER_MESSAGES.qrImport.importFailedBody,
        );
      }
      return;
    }

    if (!selection) return;

    setActivityMessage(
      selection.kind === "web"
        ? USER_MESSAGES.activity.readingQrImage
        : USER_MESSAGES.activity.importingQrImage,
    );
    try {
      const qrData = await qrImport.decodeImage(selection);
      if (!qrData) {
        showQrImportMessage(
          USER_MESSAGES.qrImport.noQrCodeFoundTitle,
          selection.kind === "web"
            ? USER_MESSAGES.qrImport.noQrCodeFoundBody
            : USER_MESSAGES.qrImport.noQrCodeTextBody,
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
      const clipboardResult = await qrImport.readClipboard(() => {
        setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
      });
      const normalizedText = normalizeTotpQrPayload(clipboardResult.text);
      if (isTotpQrPayload(normalizedText)) {
        setActivityMessage(USER_MESSAGES.activity.importingAccount);
        await onQrScannedRef.current(normalizedText, false);
        return;
      }

      const imageResult = clipboardResult;
      if (imageResult.source === "web" && !imageResult.imageAvailable) {
        showQrImportMessage(
          USER_MESSAGES.qrImport.clipboardUnavailableTitle,
          clipboardResult.text
            ? USER_MESSAGES.qrImport.clipboardUnavailableBody
            : USER_MESSAGES.qrImport.clipboardAccessBody,
        );
        return;
      }

      if (!imageResult.qrData) {
        if (imageResult.source === "web") {
          showQrImportMessage(
            USER_MESSAGES.qrImport.noQrCodeFoundTitle,
            USER_MESSAGES.qrImport.notFoundBody,
          );
        } else {
          showQrImportMessage(
            USER_MESSAGES.qrImport.noImageInClipboardTitle,
            USER_MESSAGES.qrImport.noImageInClipboardBody,
          );
        }
        return;
      }

      await onQrScannedRef.current(imageResult.qrData, false);
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
    if (!modalVisible || editingId) return;

    return qrImport.subscribeToWebEvents({
      onText: (text) => {
        const normalizedText = normalizeTotpQrPayload(text);
        if (!isTotpQrPayload(normalizedText)) return;

        setActivityMessage(USER_MESSAGES.activity.importingAccount);
        void onQrScannedRef.current(normalizedText, false).finally(() => {
          setActivityMessage(null);
        });
      },
      onImage: (image) => {
        setActivityMessage(USER_MESSAGES.activity.importingPastedImage);
        void qrImport
          .decodeImage(image)
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
      },
      onUnsupportedDrop: () => {
        showQrImportMessage(
          USER_MESSAGES.qrImport.unsupportedFileTitle,
          USER_MESSAGES.qrImport.unsupportedFileBody,
        );
      },
      onDragChange: setIsDraggingImage,
    });
  }, [modalVisible, editingId, setActivityMessage, showQrImportMessage, USER_MESSAGES]);

  return { importQrImage, pasteQrImage, isDraggingImage };
}
