import * as Clipboard from "expo-clipboard";
import type { ClipboardService } from "./types";

/** Browser text clipboard through Expo's web-compatible clipboard adapter. */
export const clipboard: ClipboardService = {
  getText: () => Clipboard.getStringAsync(),
  setText: async (value) => {
    await Clipboard.setStringAsync(value);
  },
};
