/** Cross-platform clipboard payloads use data URLs for portable image exchange. */
export type ClipboardImage = {
  dataUrl: string;
};

/** Shared system clipboard API. */
export interface ClipboardService {
  getText(): Promise<string>;
  setText(value: string): Promise<void>;
  clear(): Promise<void>;
  hasText(): Promise<boolean>;
  getImage(): Promise<ClipboardImage | null>;
  setImage(image: ClipboardImage): Promise<void>;
  hasImage(): Promise<boolean>;
}
