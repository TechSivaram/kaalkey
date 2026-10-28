import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { Account } from "../types/account";
import { encryptBackup, decryptBackup, generateBackupPassword } from "../services/backup";
import { writeAccountRecords } from "../services/account-storage";
import { mergeRestoredAccounts } from "../services/account-merge";
import {
  BACKUP_FILE_EXTENSION,
  BACKUP_FILENAME_PREFIX,
  BACKUP_MIME_TYPE,
  BACKUP_WEB_FILE_ACCEPT,
} from "../constants/backup";
import type { BackupMode } from "../types/backupMode";
import {
  getRestoreCompletionMessage,
  getRestoreConfirmationMessage,
} from "../utils/backupRestoreMessage";

type UseBackupManagerOptions = {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  backupPassword: string;
  setBackupPassword: (password: string) => void;
  setBackupBusy: (busy: boolean) => void;
  setActivityMessage: (message: string | null) => void;
  setBackupVisible: (visible: boolean) => void;
  setBackupMode: (mode: BackupMode) => void;
  setSettingsVisible: (visible: boolean) => void;
  showBackupMessage: (title: string, message: string) => void;
  hapticFeedback: (kind?: "selection" | "success" | "warning") => void;
};

export function useBackupManager({
  accounts,
  setAccounts,
  backupPassword,
  setBackupPassword,
  setBackupBusy,
  setActivityMessage,
  setBackupVisible,
  setBackupMode,
  setSettingsVisible,
  showBackupMessage,
  hapticFeedback,
}: UseBackupManagerOptions) {
  async function openBackup(mode: BackupMode) {
    hapticFeedback("selection");
    setBackupMode(mode);
    setBackupPassword("");
    if (mode === "export") {
      setBackupBusy(true);
      setActivityMessage("Generating secure backup password…");
      try {
        setBackupPassword(await generateBackupPassword());
        setBackupVisible(true);
      } catch (error) {
        showBackupMessage(
          "Could not generate backup password",
          error instanceof Error ? error.message : "Secure random generation is unavailable.",
        );
      } finally {
        setBackupBusy(false);
        setActivityMessage(null);
      }
      return;
    }
    setBackupVisible(true);
  }

  async function exportEncryptedBackup() {
    if (!/^KK-\d{14}-[a-f0-9]{64}$/.test(backupPassword)) {
      showBackupMessage(
        "Backup password unavailable",
        "Close this dialog and create a new backup to generate a secure password.",
      );
      return;
    }
    setBackupBusy(true);
    setActivityMessage("Encrypting backup…");
    try {
      const encrypted = await encryptBackup(accounts, backupPassword);
      // Reuse the timestamp embedded in the generated password so the password
      // and backup filename identify the same backup creation time.
      const passwordTimestamp = backupPassword.split("-")[1];
      const filename = `${BACKUP_FILENAME_PREFIX}${passwordTimestamp}${BACKUP_FILE_EXTENSION}`;

      if (Platform.OS === "web") {
        if (typeof document === "undefined" || typeof URL === "undefined") {
          throw new Error("Your browser does not support downloading backup files.");
        }
        const blob = new Blob([encrypted], { type: `${BACKUP_MIME_TYPE};charset=utf-8` });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        setBackupVisible(false);
        setBackupPassword("");
        showBackupMessage(
          "Backup created",
          "Your encrypted KaalKey backup has been downloaded. Keep the file and password private.",
        );
        return;
      }

      const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!base) throw new Error("A local file location is unavailable on this device.");
      const uri = `${base}${filename}`;
      await FileSystem.writeAsStringAsync(uri, encrypted, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (!(await Sharing.isAvailableAsync())) {
        showBackupMessage("Backup created", `Encrypted backup saved temporarily at:\n${uri}`);
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: BACKUP_MIME_TYPE,
          dialogTitle: "Save your encrypted KaalKey backup",
          UTI: "public.json",
        });
      }
      setBackupVisible(false);
      setBackupPassword("");
    } catch (error) {
      showBackupMessage(
        "Backup failed",
        error instanceof Error ? error.message : "KaalKey could not create the backup.",
      );
    } finally {
      setBackupBusy(false);
      setActivityMessage(null);
    }
  }

  async function pickBackupText(): Promise<string | null> {
    if (Platform.OS !== "web") {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "public.json", "*/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return null;
      return FileSystem.readAsStringAsync(picked.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Use a native browser file input on web; Expo DocumentPicker/FileSystem URI
    // handling is not reliable for browser File objects and blob URLs.
    return new Promise<string | null>((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("The browser file picker is unavailable."));
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = BACKUP_WEB_FILE_ACCEPT;
      input.style.position = "fixed";
      input.style.left = "-10000px";
      input.style.width = "1px";
      input.style.height = "1px";
      const cleanup = () => input.remove();
      input.addEventListener(
        "change",
        () => {
          const file = input.files?.[0];
          cleanup();
          if (!file) {
            resolve(null);
            return;
          }
          void file.text().then(resolve, reject);
        },
        { once: true },
      );
      input.addEventListener(
        "cancel",
        () => {
          cleanup();
          resolve(null);
        },
        { once: true },
      );
      document.body.appendChild(input);
      input.click();
    });
  }

  async function restoreEncryptedBackup() {
    if (!backupPassword) {
      showBackupMessage(
        "Enter your backup password",
        "Enter the password used when this backup was created.",
      );
      return;
    }
    setBackupBusy(true);
    try {
      const raw = await pickBackupText();
      if (raw === null) return;
      setActivityMessage("Decrypting backup…");
      const restored = await decryptBackup(raw, backupPassword);
      setActivityMessage(null);
      const message = getRestoreConfirmationMessage(restored.length);
      let shouldMerge = false;
      if (Platform.OS === "web") {
        shouldMerge =
          typeof window !== "undefined" && window.confirm(`Merge backup accounts?\n\n${message}`);
      } else {
        shouldMerge = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Merge backup accounts?",
            message,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Merge accounts", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
          );
        });
      }
      if (!shouldMerge) return;
      setActivityMessage("Restoring accounts…");

      // Merge by account identity; keep existing local accounts unchanged.
      const { accounts: merged, added } = mergeRestoredAccounts(accounts, restored);
      await writeAccountRecords(merged);
      setAccounts(merged);
      setBackupVisible(false);
      setSettingsVisible(false);
      setBackupPassword("");
      showBackupMessage("Restore complete", getRestoreCompletionMessage(added, restored.length));
    } catch (error) {
      showBackupMessage(
        "Restore failed",
        error instanceof Error ? error.message : "The backup could not be read or saved.",
      );
    } finally {
      setBackupBusy(false);
      setActivityMessage(null);
    }
  }

  return { openBackup, exportEncryptedBackup, restoreEncryptedBackup };
}
