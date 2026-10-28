# KaalKey V99

## Encrypted backup validation refactor

- Extracted backup-envelope parsing and validation into `parseBackupEnvelope`.
- Extracted decrypted payload JSON and account validation into `parseBackupPayload`.
- Malformed JSON now produces a clear backup-specific error instead of bubbling a raw JSON parser exception.
- Tightened envelope checks for a non-empty ciphertext and a 64-character hexadecimal MAC.
- Preserved backup format/version, PBKDF2 parameters, encryption/authentication algorithm, and valid backup behavior.
