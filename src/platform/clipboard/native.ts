import * as Clipboard from "expo-clipboard";
import type { ClipboardService } from "./types";

/** Expo Clipboard text operations shared by Android and iOS. */
export const clipboard: ClipboardService = {
  getText: () => Clipboard.getStringAsync(),
  setText: async (value) => {
    await Clipboard.setStringAsync(value);
  },
};
