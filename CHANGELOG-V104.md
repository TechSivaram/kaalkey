# KaalKey V104

## Paste TOTP URL callback cleanup

- Removed the unused `totpUrlInput` value parameter from the scanner hook's clipboard-paste function.
- Updated the Home screen adapter to pass only `setTotpUrlInput`.
- Clipboard contents still populate the input and are passed to the existing TOTP import flow.
- Updated package and lockfile versions to `1.1.04`.
- No intended behavior change.
