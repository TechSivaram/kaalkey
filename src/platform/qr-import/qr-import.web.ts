import {
  decodeQrImageFile,
  getImageFileFromClipboard,
  getImageFileFromDrop,
  readWebClipboard,
  normalizeClipboardTotpText,
} from "../../services/web-qr-image-import";
import type { QrImportService, WebQrImportEventHandlers } from "./types";

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
}

function pickBrowserImage(): Promise<File | undefined> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
    // Keep the input rendered but visually hidden. Chromium/Electron on some
    // Linux desktop environments may ignore programmatic clicks on inputs
    // marked with the HTML hidden attribute.
    Object.assign(input.style, {
      position: "fixed",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    input.tabIndex = -1;
    document.body.appendChild(input);

    const cleanup = () => input.remove();
    input.oncancel = () => {
      cleanup();
      resolve(undefined);
    };
    input.onchange = () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(undefined);
      } else if (!isImageFile(file)) {
        reject(new Error("unsupported_file"));
      } else {
        resolve(file);
      }
    };

    // Must remain synchronous with the user's click gesture.
    try {
      input.click();
    } catch {
      cleanup();
      reject(new Error("picker_unavailable"));
    }
  });
}

function subscribeToBrowserEvents(handlers: WebQrImportEventHandlers): () => void {
  if (typeof window === "undefined") return () => {};

  let dragEnterCount = 0;
  const hasDraggedFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");

  const resetDragState = () => {
    dragEnterCount = 0;
    handlers.onDragChange(false);
  };

  const onPaste = (event: ClipboardEvent) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || target.closest("input, textarea, [contenteditable='true']"))
    )
      return;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const text = normalizeClipboardTotpText(clipboardData.getData("text/plain").trim());
    if (text) {
      event.preventDefault();
      handlers.onText(text);
      return;
    }

    const image = getImageFileFromClipboard(clipboardData);
    if (image) {
      event.preventDefault();
      handlers.onImage({ kind: "web", file: image });
    }
  };

  const onDragEnter = (event: DragEvent) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    dragEnterCount += 1;
    handlers.onDragChange(true);
  };

  const onDragOver = (event: DragEvent) => {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer || !hasDraggedFiles(event)) return;
    event.preventDefault();
    dataTransfer.dropEffect = "copy";
    handlers.onDragChange(true);
  };

  const onDragLeave = (event: DragEvent) => {
    if (!hasDraggedFiles(event)) return;
    dragEnterCount = Math.max(0, dragEnterCount - 1);
    if (dragEnterCount === 0) handlers.onDragChange(false);
  };

  const onDrop = (event: DragEvent) => {
    const dataTransfer = event.dataTransfer;
    resetDragState();
    if (!dataTransfer?.files.length) return;
    event.preventDefault();

    const image = getImageFileFromDrop(dataTransfer);
    if (image) handlers.onImage({ kind: "web", file: image });
    else handlers.onUnsupportedDrop();
  };

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
}

export const qrImport: QrImportService = {
  async pickImage() {
    const file = await pickBrowserImage();
    return file ? { kind: "web", file } : undefined;
  },

  async decodeImage(image) {
    if (image.kind !== "web") return undefined;
    return decodeQrImageFile(image.file);
  },

  async readClipboard(onImageFound) {
    const { text, image } = await readWebClipboard();
    if (text && normalizeClipboardTotpText(text)) {
      return { text, imageAvailable: false, source: "web" };
    }
    if (!image) return { text, imageAvailable: false, source: "web" };

    onImageFound?.();
    const qrData = await decodeQrImageFile(image);
    return { text, qrData, imageAvailable: true, source: "web" };
  },

  subscribeToWebEvents: subscribeToBrowserEvents,
};

export type {
  QrClipboardResult,
  QrImageSelection,
  QrImportService,
  WebQrImportEventHandlers,
} from "./types";
