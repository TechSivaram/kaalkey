# KaalKey V102

## Account text normalization refactor

- Added `src/utils/accountText.ts` for shared case-insensitive account text normalization.
- Reused the helper in account identity generation and duplicate account detection.
- Preserved existing matching behavior: identity generation trims issuer/name; duplicate detection does not trim.
- Updated package and lockfile versions to `1.1.02`.
- No intended account matching behavior change.
