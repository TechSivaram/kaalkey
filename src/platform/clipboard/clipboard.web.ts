import * as Clipboard from "expo-clipboard";
import type { ClipboardImage, ClipboardService } from "./types";

/** Browser clipboard with an Electron-native bridge when running the desktop app. */
export const clipboard: ClipboardService = {
  getText: async () => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      return window.kaalkeyDesktop.clipboard.readText();
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
      return navigator.clipboard.readText();
    }
    return Clipboard.getStringAsync();
  },
  setText: async (value) => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      const success = await window.kaalkeyDesktop.clipboard.writeText(value);
      if (!success) throw new Error("Clipboard write failed.");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const success = await Clipboard.setStringAsync(value);
    if (!success) throw new Error("Clipboard write failed.");
  },
  clear: async () => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      await window.kaalkeyDesktop.clipboard.clear();
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText("");
      return;
    }
    const success = await Clipboard.setStringAsync("");
    if (!success) throw new Error("Clipboard clear failed.");
  },
  hasText: async () => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      return window.kaalkeyDesktop.clipboard.hasText();
    }
    return (await clipboard.getText()).length > 0;
  },
  getImage: async () => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      return window.kaalkeyDesktop.clipboard.readImage();
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((candidate) => candidate.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          return { dataUrl: await blobToDataUrl(blob) };
        }
      }
      return null;
    }
    const image = await Clipboard.getImageAsync({ format: "png" });
    return image?.data ? { dataUrl: image.data } : null;
  },
  setImage: async (image: ClipboardImage) => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      await window.kaalkeyDesktop.clipboard.writeImage(image.dataUrl);
      return;
    }
    const blob = await dataUrlToBlob(image.dataUrl);
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.write &&
      typeof ClipboardItem !== "undefined"
    ) {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      return;
    }
    await Clipboard.setImageAsync(image.dataUrl.replace(/^data:image\/[^;]+;base64,/i, ""));
  },
  hasImage: async () => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      return window.kaalkeyDesktop.clipboard.hasImage();
    }
    return Boolean(await clipboard.getImage());
  },
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Unable to read clipboard image."));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read clipboard image."));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("Unable to decode clipboard image.");
  return response.blob();
}
