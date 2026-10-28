# KaalKey V101

## TOTP QR payload normalization refactor

- Extracted QR payload cleanup into `src/utils/totpQrPayload.ts`.
- Centralized removal of invisible Unicode formatting characters, trimming, and legacy `otpauth://totp/` prefix normalization.
- Added a shared TOTP setup-URI predicate and reused it for camera scans and pasted/imported URLs.
- Preserves existing account parsing, duplicate detection, save flow, and user-facing messages.
- No intended QR import behavior change.
