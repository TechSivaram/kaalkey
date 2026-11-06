import type { DesktopLockResult, DesktopLockStatus } from "./types";

export function isDesktopRuntime(): boolean {
  return typeof window !== "undefined" && !!window.kaalkeyDesktop;
}

export async function getDesktopLockStatus(): Promise<DesktopLockStatus> {
  if (!window.kaalkeyDesktop) return { configured: false, timeoutMs: 300_000 };
  return window.kaalkeyDesktop.lock.getStatus();
}

export async function setDesktopPin(pin: string): Promise<DesktopLockResult> {
  if (!window.kaalkeyDesktop) return { success: false, error: "not_available" };
  return window.kaalkeyDesktop.lock.setPin(pin);
}

export async function verifyDesktopPin(pin: string): Promise<DesktopLockResult> {
  if (!window.kaalkeyDesktop) return { success: false, error: "not_available" };
  return window.kaalkeyDesktop.lock.verifyPin(pin);
}
