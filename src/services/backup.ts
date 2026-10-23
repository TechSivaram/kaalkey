import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import type { Account } from "../types/account";

const BACKUP_FORMAT = "kaalkey-encrypted-backup";
const BACKUP_VERSION = 1;
const BACKUP_KDF_ITERATIONS = 250000;
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex);
}

function validateAccounts(value: unknown): value is Account[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.issuer === "string" &&
      typeof item.name === "string" &&
      typeof item.secret === "string" &&
      ["SHA1", "SHA256", "SHA512"].includes(item.algorithm) &&
      Number.isInteger(item.digits) &&
      item.digits >= 6 &&
      item.digits <= 8 &&
      Number.isInteger(item.period) &&
      item.period >= 1 &&
      item.period <= 120,
  );
}

export async function encryptBackup(accounts: Account[], password: string): Promise<string> {
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const iv = bytesToHex(await Crypto.getRandomBytesAsync(16));
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
  const envelope = JSON.parse(raw);
  if (
    !envelope ||
    envelope.format !== BACKUP_FORMAT ||
    envelope.version !== BACKUP_VERSION ||
    envelope.kdf !== "PBKDF2-SHA256" ||
    envelope.iterations !== BACKUP_KDF_ITERATIONS ||
    typeof envelope.salt !== "string" ||
    !/^[a-f0-9]{32}$/i.test(envelope.salt) ||
    typeof envelope.iv !== "string" ||
    !/^[a-f0-9]{32}$/i.test(envelope.iv) ||
    typeof envelope.ciphertext !== "string" ||
    typeof envelope.mac !== "string"
  ) {
    throw new Error("This is not a supported KaalKey encrypted backup.");
  }
  const macKey = CryptoJS.PBKDF2(password, hexToWordArray(envelope.salt + "01"), {
    keySize: 256 / 32,
    iterations: BACKUP_KDF_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  const authenticated = `${BACKUP_FORMAT}.${BACKUP_VERSION}.${envelope.salt}.${envelope.iv}.${envelope.ciphertext}`;
  const expectedMac = CryptoJS.HmacSHA256(authenticated, macKey).toString(CryptoJS.enc.Hex);
  if (
    expectedMac.length !== envelope.mac.length ||
    !CryptoJS.enc.Hex.parse(expectedMac).toString() ||
    expectedMac.toLowerCase() !== envelope.mac.toLowerCase()
  ) {
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
  const payload = JSON.parse(text);
  if (
    payload?.format !== BACKUP_FORMAT ||
    payload?.version !== BACKUP_VERSION ||
    !validateAccounts(payload.accounts)
  ) {
    throw new Error("The backup contents are invalid or incomplete.");
  }
  return payload.accounts;
}
