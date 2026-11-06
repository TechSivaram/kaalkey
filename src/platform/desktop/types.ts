export type DesktopLockStatus = { configured: boolean; timeoutMs: number };
export type DesktopLockResult = { success: boolean; error?: string; retryAfterMs?: number };

export type DesktopBridge = {
  lock: {
    getStatus(): Promise<DesktopLockStatus>;
    setPin(pin: string): Promise<DesktopLockResult>;
    verifyPin(pin: string): Promise<DesktopLockResult>;
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
