export type QrImageSelection = { kind: "native"; uri: string } | { kind: "web"; file: Blob };

export type QrClipboardResult = {
  text: string;
  qrData?: string;
  imageAvailable: boolean;
  source: "web" | "native";
};

export type WebQrImportEventHandlers = {
  onText: (text: string) => void;
  onImage: (image: QrImageSelection) => void;
  onUnsupportedDrop: () => void;
  onDragChange: (dragging: boolean) => void;
};

export type QrImportService = {
  pickImage: () => Promise<QrImageSelection | undefined>;
  decodeImage: (image: QrImageSelection) => Promise<string | undefined>;
  readClipboard: (onImageFound?: () => void) => Promise<QrClipboardResult>;
  subscribeToWebEvents: (handlers: WebQrImportEventHandlers) => () => void;
};
