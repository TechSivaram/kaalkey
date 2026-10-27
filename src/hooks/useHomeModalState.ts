import { useState } from "react";

/** Owns the home screen's settings, backup, and activity modal state. */
export function useHomeModalState() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [backupMode, setBackupMode] = useState<"export" | "restore">("export");
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
