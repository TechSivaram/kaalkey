/** Register the Electron-native clipboard IPC handlers. */
function registerClipboardHandlers(ipcMain, clipboard, nativeImage) {
  ipcMain.handle("desktop-clipboard:write-text", (_, value) => {
    if (typeof value !== "string") {
      throw new TypeError("Clipboard content must be a string.");
    }
    // Electron clipboard.writeText is synchronous and returns void.
    clipboard.writeText(value);
    return true;
  });

  ipcMain.handle("desktop-clipboard:read-text", () => clipboard.readText());

  ipcMain.handle("desktop-clipboard:clear", () => {
    clipboard.clear();
    return true;
  });

  ipcMain.handle("desktop-clipboard:has-text", () => {
    const formats = clipboard.availableFormats();
    return formats.some((format) =>
      /^(text\/|utf8_string$|string$|public\.utf8-plain-text$)/i.test(format),
    );
  });

  ipcMain.handle("desktop-clipboard:write-image", (_, dataUrl) => {
    if (typeof dataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,/i.test(dataUrl)) {
      throw new TypeError("Clipboard image must be a supported base64 image data URL.");
    }
    const image = nativeImage.createFromDataURL(dataUrl);
    if (image.isEmpty()) throw new TypeError("Clipboard image data is invalid.");
    clipboard.writeImage(image);
    return true;
  });

  ipcMain.handle("desktop-clipboard:read-image", () => {
    let formats = [];
    try {
      formats = clipboard.availableFormats();
    } catch {
      // Continue with readImage(); some clipboard backends cannot enumerate formats.
    }

    try {
      const image = clipboard.readImage();
      if (image && !image.isEmpty()) {
        const dataUrl = image.toDataURL();
        if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
          return { dataUrl };
        }
      }
    } catch (error) {
      console.warn("[clipboard] Native readImage failed; trying encoded image formats.", {
        message: error instanceof Error ? error.message : String(error),
        formats,
      });
    }

    // Some Windows applications (including paint/image editors) publish an
    // encoded image format that is not surfaced by NativeImage.readImage().
    // Try advertised encoded formats individually before declaring no image.
    const encodedImageFormats = formats.filter((format) =>
      /^(image\/(png|jpeg|bmp|webp|tiff?)|png|jfif|jpeg|image)$/i.test(format),
    );
    for (const format of encodedImageFormats) {
      try {
        const buffer = clipboard.readBuffer(format);
        if (!buffer || buffer.length === 0) continue;
        const image = nativeImage.createFromBuffer(buffer);
        if (!image || image.isEmpty()) continue;
        const dataUrl = image.toDataURL();
        if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
          return { dataUrl };
        }
      } catch (error) {
        console.warn("[clipboard] Encoded image format could not be decoded.", {
          format,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  });

  ipcMain.handle("desktop-clipboard:has-image", () => {
    try {
      const image = clipboard.readImage();
      return Boolean(image && !image.isEmpty());
    } catch (error) {
      console.error("[clipboard] Native image availability check failed.", {
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  });
}

module.exports = { registerClipboardHandlers };
