import { useCallback, useState } from "react";
import { setGlobalActivityMessage } from "../utils/globalActivity";
import type { BackupMode } from "../types/backupMode";

/** Owns the home screen's settings, backup, and activity modal state. */
export function useHomeModalState() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [backupMode, setBackupMode] = useState<BackupMode>("export");
  const [backupPassword, setBackupPassword] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [activityMessage, setActivityMessageState] = useState<string | null>(null);
  const setActivityMessage = useCallback((message: string | null) => {
    setActivityMessageState(message);
    setGlobalActivityMessage(message);
  }, []);

  return {
    settingsVisible,
    setSettingsVisible,
    backupVisible,
    setBackupVisible,
    backupMode,
    setBackupMode,
    backupPassword,
    setBackupPassword,
    backupBusy,
    setBackupBusy,
    activityMessage,
    setActivityMessage,
  };
}
