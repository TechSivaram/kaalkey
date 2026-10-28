# KaalKey V103

## TOTP validation rules refactor

- Extracted supported TOTP algorithm, digit-count, and period checks into `src/utils/totpValidation.ts`.
- `src/services/account-validation.ts` now imports the pure validation rules and retains account shape checks, Base32 normalization, and OTPAuth generation validation.
- Kept the same supported constants and validation expressions; no intended behavior change.
- Updated package and lockfile version to `1.1.03`.
