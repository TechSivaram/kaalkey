/** Shared backup password policy values. Keep UI guidance and validation aligned. */
export const MIN_BACKUP_PASSWORD_LENGTH = 10;

/** Backup file naming and content-type values shared by export and import. */
export const BACKUP_FILENAME_PREFIX = "kaalkey-backup-";
export const BACKUP_FILE_EXTENSION = ".kkbackup";
export const BACKUP_MIME_TYPE = "application/json";
export const BACKUP_WEB_FILE_ACCEPT = `${BACKUP_FILE_EXTENSION},.json,${BACKUP_MIME_TYPE},text/plain`;
