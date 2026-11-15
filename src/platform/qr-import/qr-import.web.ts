import { clipboard } from "../clipboard/clipboard";
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
  if (typeof window !== "undefined" && window.kaalkeyDesktop?.files) {
    return window.kaalkeyDesktop.files.pickQrImage().then((selected) => {
      if (!selected) return undefined;
      const buffer = new ArrayBuffer(selected.data.byteLength);
      new Uint8Array(buffer).set(selected.data);
      return new File([buffer], selected.name, { type: selected.type });
    });
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
    input.hidden = true;
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
    // Start the browser clipboard read immediately, while the Paste button's
    // user activation is still active. Awaiting Electron IPC first can consume
    // Chromium's transient user activation and make navigator.clipboard.read()
    // fail even though the user explicitly clicked Paste.
    const browserClipboardPromise = readWebClipboard();

    // Electron's native clipboard remains the primary desktop source. Some
    // Windows providers expose an image to Chromium but not NativeImage, so
    // retain the browser result as a fallback instead of reporting unavailable.
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      let text = "";
      try {
        text = (await clipboard.getText()).trim();
      } catch {
        // Continue to image reads; image-only clipboard providers may reject text.
      }

      if (text && normalizeClipboardTotpText(text)) {
        return { text, imageAvailable: false, source: "web" };
      }

      let nativeImage: Awaited<ReturnType<typeof clipboard.getImage>> = null;
      try {
        nativeImage = await clipboard.getImage();
      } catch {
        // Use Chromium's user-gesture clipboard read below.
      }

      if (nativeImage) {
        onImageFound?.();
        const response = await fetch(nativeImage.dataUrl);
        if (!response.ok) throw new Error("Unable to load image from system clipboard.");
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) {
          throw new Error("System clipboard did not return a supported image.");
        }
        const qrData = await decodeQrImageFile(blob);
        return { text, qrData, imageAvailable: true, source: "web" };
      }

      const browserClipboard = await browserClipboardPromise;
      const browserText = browserClipboard.text || text;
      if (browserText && normalizeClipboardTotpText(browserText)) {
        return { text: browserText, imageAvailable: false, source: "web" };
      }
      if (browserClipboard.image) {
        onImageFound?.();
        const qrData = await decodeQrImageFile(browserClipboard.image);
        return { text: browserText, qrData, imageAvailable: true, source: "web" };
      }
      return { text: browserText, imageAvailable: false, source: "web" };
    }

    const { text, image } = await browserClipboardPromise;
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
