import * as Clipboard from "expo-clipboard";
import type { ClipboardService } from "./types";

/** Use Electron's native clipboard in desktop builds and Expo in browsers. */
export const clipboard: ClipboardService = {
  getText: () => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      return window.kaalkeyDesktop.clipboard.readText();
    }
    return Clipboard.getStringAsync();
  },
  setText: async (value) => {
    if (typeof window !== "undefined" && window.kaalkeyDesktop) {
      await window.kaalkeyDesktop.clipboard.writeText(value);
      return;
    }
    await Clipboard.setStringAsync(value);
  },
};
