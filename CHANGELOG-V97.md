# KaalKey V97

## Account storage flow refactor

- Added `parseStoredAccounts` to the account-storage service to parse persisted JSON and filter invalid account records consistently.
- Added `writeAccountRecords` as the shared typed persistence entry point.
- Updated `useAccounts` to use the shared parser and writer while preserving existing alerts and valid-account recovery behavior.
- Updated encrypted-backup restore to use the same shared persistence entry point.
- Storage keys, native SecureStore behavior, web localStorage behavior, backup format, and restore merge semantics remain unchanged.
