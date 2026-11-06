/** Shared text clipboard API. */
export interface ClipboardService {
  getText(): Promise<string>;
  setText(value: string): Promise<void>;
}
