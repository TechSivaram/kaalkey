# KaalKey Secure Backup & Restore

## How it works

- Backups are encrypted before being shared or saved.
- Encryption uses AES-256-CBC with PKCS#7 padding, a random 128-bit IV, and a password-derived key (PBKDF2-SHA256, 250,000 iterations).
- An HMAC-SHA256 authenticates the backup before decryption so a wrong password or altered file is rejected.
- The `.kkbackup` file contains only the encrypted payload and encryption metadata; it does not contain a plain-text account list.
- Restore validates the decrypted account structure and asks for confirmation before replacing accounts already on the device.

## Create a backup

1. Open Settings > Backup & Recovery > Create backup.
2. Choose a strong password of at least 10 characters.
3. Save/share the generated `.kkbackup` file in a private location.
4. Keep the password separately. KaalKey cannot recover a forgotten backup password.

## Restore a backup

1. Open Settings > Backup & Recovery > Restore backup.
2. Enter the password used when the backup was created.
3. Choose the `.kkbackup` file.
4. Confirm replacement of the accounts on this device.

## Important

- Restore replaces all current accounts; export a backup first if you need to preserve them.
- Never send your backup file or password to anyone. Authenticator secrets are sensitive.
- This project change has not been tested on a physical device in this environment. Test backup and restore using non-critical test accounts before relying on it.
