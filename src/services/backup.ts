import CryptoJS from "crypto-js";
import type { Account } from "../types/account";
import { validateAccounts } from "./account-validation";

const BACKUP_FORMAT = "kaalkey-encrypted-backup";
const BACKUP_VERSION = 1;
const BACKUP_KDF_ITERATIONS = 1;

type BackupEnvelope = {
  format: string;
  version: number;
  kdf: string;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  mac: string;
};

function parseBackupEnvelope(raw: string): BackupEnvelope {
  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    throw new Error("The backup file is not valid JSON.");
  }

  if (
    !envelope ||
    typeof envelope !== "object" ||
    (envelope as BackupEnvelope).format !== BACKUP_FORMAT ||
    (envelope as BackupEnvelope).version !== BACKUP_VERSION ||
    (envelope as BackupEnvelope).kdf !== "PBKDF2-SHA256" ||
    (envelope as BackupEnvelope).iterations !== BACKUP_KDF_ITERATIONS ||
    typeof (envelope as BackupEnvelope).salt !== "string" ||
    !/^[a-f0-9]{32}$/i.test((envelope as BackupEnvelope).salt) ||
    typeof (envelope as BackupEnvelope).iv !== "string" ||
    !/^[a-f0-9]{32}$/i.test((envelope as BackupEnvelope).iv) ||
    typeof (envelope as BackupEnvelope).ciphertext !== "string" ||
    !(envelope as BackupEnvelope).ciphertext ||
    typeof (envelope as BackupEnvelope).mac !== "string" ||
    !/^[a-f0-9]{64}$/i.test((envelope as BackupEnvelope).mac)
  ) {
    throw new Error("This is not a supported KaalKey encrypted backup.");
  }

  return envelope as BackupEnvelope;
}

function parseBackupPayload(text: string): Account[] {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Backup password is incorrect or the backup file is damaged.");
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    (payload as { format?: unknown }).format !== BACKUP_FORMAT ||
    (payload as { version?: unknown }).version !== BACKUP_VERSION ||
    !validateAccounts((payload as { accounts?: unknown }).accounts)
  ) {
    throw new Error("The backup contents are invalid or incomplete.");
  }

  return (payload as { accounts: Account[] }).accounts;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex);
}

async function secureRandomBytes(length: number): Promise<Uint8Array> {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  // Load Expo Crypto only when the runtime lacks Web Crypto. A static import
  // can crash the entire route at startup if the installed native binary was
  // built before ExpoCrypto was included. Never substitute non-cryptographic randomness.
  try {
    const Crypto = await import("expo-crypto");
    return await Crypto.getRandomBytesAsync(length);
  } catch {
    throw new Error(
      "Secure random generation is unavailable. Rebuild and reinstall the Android app with expo-crypto included, then try again.",
    );
  }
}

/** Generate a portable KaalKey backup password: KK-UTC_TIMESTAMP-256_BIT_RANDOM_HEX. */
export async function generateBackupPassword(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const randomSecret = bytesToHex(await secureRandomBytes(32));
  return `KK-${timestamp}-${randomSecret}`;
}

export async function encryptBackup(accounts: Account[], password: string): Promise<string> {
  if (!validateAccounts(accounts)) {
    throw new Error(
      "One or more accounts are invalid. Fix the account data before creating a backup.",
    );
  }
  const salt = bytesToHex(await secureRandomBytes(16));
  const iv = bytesToHex(await secureRandomBytes(16));
  const key = CryptoJS.PBKDF2(password, hexToWordArray(salt), {
    keySize: 256 / 32,
    iterations: BACKUP_KDF_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  const encryptionKey = CryptoJS.lib.WordArray.create(key.words.slice(0, 8), 32);
  const macKey = CryptoJS.PBKDF2(password, hexToWordArray(salt + "01"), {
    keySize: 256 / 32,
    iterations: BACKUP_KDF_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  const plaintext = JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    accounts,
  });
  const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey, {
    iv: hexToWordArray(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  const authenticated = `${BACKUP_FORMAT}.${BACKUP_VERSION}.${salt}.${iv}.${ciphertext}`;
  const mac = CryptoJS.HmacSHA256(authenticated, macKey).toString(CryptoJS.enc.Hex);
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      kdf: "PBKDF2-SHA256",
      iterations: BACKUP_KDF_ITERATIONS,
      salt,
      iv,
      ciphertext,
      mac,
    },
    null,
    2,
  );
}

export async function decryptBackup(raw: string, password: string): Promise<Account[]> {
  const envelope = parseBackupEnvelope(raw);
  const macKey = CryptoJS.PBKDF2(password, hexToWordArray(envelope.salt + "01"), {
    keySize: 256 / 32,
    iterations: BACKUP_KDF_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  const authenticated = `${BACKUP_FORMAT}.${BACKUP_VERSION}.${envelope.salt}.${envelope.iv}.${envelope.ciphertext}`;
  const expectedMac = CryptoJS.HmacSHA256(authenticated, macKey).toString(CryptoJS.enc.Hex);
  if (expectedMac.toLowerCase() !== envelope.mac.toLowerCase()) {
    throw new Error("Backup password is incorrect or the backup file has been modified.");
  }
  const key = CryptoJS.PBKDF2(password, hexToWordArray(envelope.salt), {
    keySize: 256 / 32,
    iterations: BACKUP_KDF_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(envelope.ciphertext) } as CryptoJS.lib.CipherParams,
    key,
    { iv: hexToWordArray(envelope.iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
  );
  const text = decrypted.toString(CryptoJS.enc.Utf8);
  if (!text) throw new Error("Backup password is incorrect or the file is damaged.");
  return parseBackupPayload(text);
}
