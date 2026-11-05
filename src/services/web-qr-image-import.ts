import { decodeQrPixels } from "./qr-image-decoder";
import { isTotpQrPayload, normalizeTotpQrPayload } from "../utils/totpQrPayload";

export type WebClipboardContent = {
  text: string;
  image?: Blob;
};

/** Decode a selected or dropped browser image, using BarcodeDetector when available. */
export async function decodeQrImageFile(file: Blob): Promise<string | undefined> {
  const BrowserImage = globalThis.Image;
  if (!BrowserImage) throw new Error("Browser image decoding is unavailable");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new BrowserImage();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image could not be loaded"));
      image.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw new Error("Image dimensions are unreadable");

    let qrText: string | undefined;
    const Detector = (
      globalThis as typeof globalThis & {
        BarcodeDetector?: new (options?: { formats?: string[] }) => {
          detect(source: HTMLImageElement | HTMLCanvasElement): Promise<{ rawValue?: string }[]>;
        };
      }
    ).BarcodeDetector;

    if (Detector) {
      try {
        const detected = await new Detector({ formats: ["qr_code"] }).detect(image);
        qrText = detected.find((item) => item.rawValue)?.rawValue;
      } catch {
        // BarcodeDetector is an optional fast path; jsQR remains the fallback.
      }
    }

    const maxDimension = 1800;
    const sourceMaxDimension = Math.max(sourceWidth, sourceHeight);
    const baseScale = Math.min(1, maxDimension / sourceMaxDimension);
    const primaryScale = sourceMaxDimension < 900 ? 1.5 : baseScale;

    const decodeAtScale = (scale: number, cropCenter = false) => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return undefined;

      context.imageSmoothingEnabled = scale < 1;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const left = cropCenter ? Math.floor(canvas.width * 0.14) : 0;
      const top = cropCenter ? Math.floor(canvas.height * 0.14) : 0;
      const width = Math.max(1, canvas.width - left * 2);
      const height = Math.max(1, canvas.height - top * 2);
      const pixels = context.getImageData(left, top, width, height);
      return decodeQrPixels(pixels.data, pixels.width, pixels.height);
    };

    if (!qrText) qrText = decodeAtScale(primaryScale);
    if (!qrText) qrText = decodeAtScale(primaryScale, true);
    if (!qrText) {
      const alternateScale = primaryScale < 1 ? 1 : 0.75;
      if (alternateScale !== primaryScale) qrText = decodeAtScale(alternateScale);
    }
    return qrText;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Read available clipboard text and image data from a user-initiated browser action. */
function getImageMimeType(bytes: Uint8Array): string | undefined {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (bytes.length >= 6 && String.fromCharCode(bytes[0], bytes[1], bytes[2]) === "GIF")
    return "image/gif";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
  )
    return "image/webp";
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  return undefined;
}

async function readClipboardImage(item: ClipboardItem): Promise<Blob | undefined> {
  const imageType = item.types.find((type) => type.startsWith("image/"));
  if (imageType) return item.getType(imageType);

  // Some clipboard providers expose copied files as generic binary data.
  for (const type of item.types) {
    if (type.startsWith("text/")) continue;
    try {
      const blob = await item.getType(type);
      const mimeType = getImageMimeType(new Uint8Array(await blob.arrayBuffer()));
      if (mimeType) return new Blob([blob], { type: mimeType });
    } catch {
      // Ignore clipboard representations the browser does not allow us to read.
    }
  }
  return undefined;
}

export async function readWebClipboard(): Promise<WebClipboardContent> {
  let text = "";
  let image: Blob | undefined;

  try {
    const clipboardItems = await navigator.clipboard?.read?.();
    for (const item of clipboardItems ?? []) {
      if (!text && item.types.includes("text/plain")) {
        text = (await (await item.getType("text/plain")).text()).trim();
      }
      if (!image) image = await readClipboardImage(item);
    }
  } catch {
    // Fall back to text-only access if image clipboard access is restricted.
  }

  if (!text) {
    try {
      text = ((await navigator.clipboard?.readText?.()) ?? "").trim();
    } catch {
      text = "";
    }
  }

  return { text, image };
}

export function normalizeClipboardTotpText(text: string): string | undefined {
  const normalized = normalizeTotpQrPayload(text);
  return text && isTotpQrPayload(normalized) ? normalized : undefined;
}

const QR_IMAGE_FILE_EXTENSION = /\.(png|jpe?g|webp|gif|bmp)$/i;

function isQrImageFile(file: File): boolean {
  // Some desktop file managers expose copied files with an empty or generic MIME type.
  return file.type.startsWith("image/") || QR_IMAGE_FILE_EXTENSION.test(file.name);
}

export function getImageFileFromClipboard(data: DataTransfer): File | undefined {
  // Do not rely on DataTransferItem.type: copied desktop files can use a generic
  // MIME type even though getAsFile() returns the original image filename.
  for (let index = 0; index < data.items.length; index++) {
    const file = data.items[index].getAsFile();
    if (file && isQrImageFile(file)) return file;
  }

  return Array.from(data.files).find(isQrImageFile);
}

export function getImageFileFromDrop(data: DataTransfer): File | undefined {
  return Array.from(data.files).find(isQrImageFile);
}
