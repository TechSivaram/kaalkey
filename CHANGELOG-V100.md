# KaalKey V100

## V99 backup parser syntax fix

- Replaced the literal `\\n` embedded between the `parseBackupEnvelope` and PBKDF2 statements with a real source line break.
- This fixes the Babel/Metro syntax error in `src/services/backup.ts` at `decryptBackup`.
- Retains V99 backup validation and cryptographic flow; no intended behavior change.
