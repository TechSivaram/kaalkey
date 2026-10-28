import { useState } from "react";
import type { BackupMode } from "../types/backupMode";

/** Owns the home screen's settings, backup, and activity modal state. */
export function useHomeModalState() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [backupMode, setBackupMode] = useState<BackupMode>("export");
  const [backupPassword, setBackupPassword] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [activityMessage, setActivityMessage] = useState<string | null>(null);

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
