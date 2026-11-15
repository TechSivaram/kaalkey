export type DesktopLockStatus = { configured: boolean; timeoutMs: number };
export type DesktopLockResult = { success: boolean; error?: string; retryAfterMs?: number };
export type DesktopImageFile = { name: string; type: string; data: Uint8Array };
export type DesktopClipboardImage = { dataUrl: string };

export type DesktopBridge = {
  clipboard: {
    writeText(value: string): Promise<boolean>;
    readText(): Promise<string>;
    clear(): Promise<boolean>;
    hasText(): Promise<boolean>;
    writeImage(dataUrl: string): Promise<boolean>;
    readImage(): Promise<DesktopClipboardImage | null>;
    hasImage(): Promise<boolean>;
  };
  files: {
    pickBackupText(): Promise<string | null>;
    pickQrImage(): Promise<DesktopImageFile | null>;
  };
  lock: {
    getStatus(): Promise<DesktopLockStatus>;
    setPin(pin: string): Promise<DesktopLockResult>;
    verifyPin(pin: string): Promise<DesktopLockResult>;
    resetPin(): Promise<DesktopLockResult>;
  };
  window: {
    getMode(): Promise<"sidebar" | "expanded">;
    toggleMode(): Promise<"sidebar" | "expanded">;
    minimize(): Promise<boolean>;
    close(): Promise<boolean>;
  };
};

declare global {
  interface Window {
    kaalkeyDesktop?: DesktopBridge;
  }
}
