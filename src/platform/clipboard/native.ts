import * as Clipboard from "expo-clipboard";
import type { ClipboardImage, ClipboardService } from "./types";

/** Expo-backed clipboard implementation for Android and iOS. */
export const clipboard: ClipboardService = {
  getText: () => Clipboard.getStringAsync(),
  setText: async (value) => {
    await Clipboard.setStringAsync(value);
  },
  clear: async () => {
    await Clipboard.setStringAsync("");
  },
  hasText: () => Clipboard.hasStringAsync(),
  getImage: async () => {
    const image = await Clipboard.getImageAsync({ format: "png" });
    return image?.data ? { dataUrl: image.data } : null;
  },
  setImage: async (image: ClipboardImage) => {
    if (!image.dataUrl.startsWith("data:image/")) {
      throw new TypeError("Clipboard image must be an image data URL.");
    }
    await Clipboard.setImageAsync(image.dataUrl.replace(/^data:image\/[^;]+;base64,/i, ""));
  },
  hasImage: () => Clipboard.hasImageAsync(),
};
