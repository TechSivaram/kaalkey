import { useCallback, useState } from "react";
import type { Account } from "../types/account";

type HapticFeedback = (kind?: "selection" | "success" | "warning") => void;

/** Owns the selected account and reveal state for the account QR modal. */
export function useAccountQrModal(hapticFeedback: HapticFeedback) {
  const [qrAccount, setQrAccount] = useState<Account | null>(null);
  const [qrRevealed, setQrRevealed] = useState(false);

  const openAccountQr = useCallback(
    (account: Account) => {
      hapticFeedback("selection");
      setQrAccount(account);
      setQrRevealed(false);
    },
    [hapticFeedback],
  );

  const closeAccountQr = useCallback(() => {
    setQrRevealed(false);
    setQrAccount(null);
  }, []);

  return {
    qrAccount,
    qrRevealed,
    setQrRevealed,
    openAccountQr,
    closeAccountQr,
  };
}
