# KaalKey Authenticator

KaalKey Authenticator is a local-first authenticator for generating time-based one-time passwords (TOTP). It supports adding authenticator accounts by scanning a setup QR code, importing a QR-code image, pasting a QR image where supported, importing an `otpauth://totp/` setup URL, or entering account details manually.

> **Security reminder:** Authenticator secrets and exported backups are sensitive. Protect your device, do not share setup QR codes or secrets, and keep backup files and their passwords private.

## Features

### Authenticator codes and accounts

- Generates time-based one-time passwords (TOTP).
- Displays account/service names and account names alongside their current verification codes and countdown.
- Add an account by scanning a setup QR code with the camera.
- Import a QR code from a PNG or JPEG image.
- Paste a copied QR image where the browser/device clipboard supports image access.
- Import an authenticator setup URL beginning with `otpauth://totp/` by pasting it into the URL import field.
- Add accounts manually. The manual-entry section is collapsed by default.
- Detects invalid account data and duplicate accounts during account creation/import.
- Copy a generated verification code to the clipboard.
- View an account's setup QR code generated from the locally stored account details. **This QR code contains the account's authenticator secret; anyone who scans it may be able to generate codes for that account.**
- Delete accounts stored on the current device/browser.

### Editing restrictions

When editing an existing account, only these fields can be changed:

- Service name
- Account name

The existing secret key and OTP configuration are preserved when saving an edit. The secret, algorithm, digit count, and refresh period are not editable through the existing-account editor.

### Backup and restore

- Create a password-encrypted backup file (`.kkbackup`).
- Restore from a backup file using the password used to create it.
- Backup export requires a password of at least 10 characters.
- Backup encryption uses AES encryption, PBKDF2-SHA256 with 250,000 iterations, and an HMAC-SHA256 integrity check.
- Restore asks before merging. Existing local accounts are retained; accounts already present in the vault are skipped as duplicates.
- KaalKey cannot recover a forgotten backup password. Keep the password separate from the backup file.

### Privacy and device settings

- Account data is stored locally by the app; the app's account-storage implementation does not send accounts to a KaalKey server.
- Native Android/iOS builds use Expo SecureStore for account records. The web build uses browser `localStorage` scoped to that browser origin; browser localStorage is **not equivalent to encrypted native secure storage**.
- Optional device-authentication lock uses the device's available local authentication (for example, biometrics or device passcode) where supported by the platform.
- Optional haptic feedback.
- Built-in Privacy Policy and Terms of Use screens.
- An activity overlay is shown for supported import, backup, restore, and other longer-running operations to help prevent accidental interaction while work is in progress.

## Supported OTP configuration

KaalKey validates account records and imported setup data against these limits:

- **OTP type:** TOTP (time-based); ordinary login QR codes and non-TOTP QR codes are not supported as authenticator setup codes.
- **Algorithms:** SHA1, SHA256, and SHA512.
- **Digits:** 6, 7, or 8.
- **Period:** 1–120 seconds.
- **Secret:** Base32 characters (`A–Z` and `2–7`), after normalization.

Some services use non-standard or unsupported authenticator formats. If an imported QR code or URL does not match the supported TOTP format and limits, import may fail. Use the TOTP setup QR code or setup key supplied by the service, not its regular sign-in QR code.

## Restrictions and important limitations

- **No cloud sync:** Accounts are stored locally. Installing KaalKey on another device does not automatically transfer accounts; use an encrypted backup to migrate them.
- **Web storage caveat:** Browser data can be lost if site data is cleared, the browser profile is removed, or storage is unavailable. Anyone who can use the same browser profile may potentially access web-stored data. Protect the device and browser profile.
- **Native storage caveat:** SecureStore relies on operating-system storage behavior and does not protect secrets from every possible compromised-device scenario.
- **Backup password cannot be recovered:** If it is forgotten, KaalKey cannot decrypt the backup for you.
- **Backups contain recoverable secrets after decryption:** Keep the file and password private. Do not send them to untrusted people or services.
- **QR codes reveal secrets:** Treat both imported setup QR codes and QR codes displayed by KaalKey as sensitive.
- **Clipboard support varies:** Pasting QR images depends on browser/device clipboard permissions and supported clipboard formats. If image paste is unavailable, use **Import QR image** instead. On the web, image paste is initiated with `Ctrl+V` on Windows/Linux or `⌘+V` on macOS when the import form is open and focused.
- **Camera access requires permission:** Camera scanning works only where camera access is available and granted. Use QR image import or manual entry if camera access is unavailable.
- **No account-provider recovery:** KaalKey generates codes but does not control the services protected by those codes. Keep each service's own recovery codes and recovery options.
- **No guarantee of uninterrupted operation or universal compatibility:** The app's embedded Terms of Use explain that not every QR/configuration is guaranteed to be compatible and operation may be interrupted or fail.
- **Appearance:** The current interface uses a light theme; a theme switcher is not currently provided.
- **No password reset for local vault or backup:** The backup password is separate from any device lock. The app does not provide a way to recover a forgotten backup password.

## Technology stack

- Expo / React Native, with a web build through React Native Web
- TypeScript
- `otpauth` for TOTP generation and setup-URL parsing
- `jsqr` for decoding QR codes from supported images
- Expo Camera, Clipboard, Image Picker, File System, Document Picker, Sharing, SecureStore, and Local Authentication APIs

## Requirements

Install a compatible Node.js LTS release and npm. Install dependencies from the project root:

```bash
npm install
```

## Run the app

Start the Expo development server:

```bash
npm start
```

Run the web version:

```bash
npm run web
```

Run on Android (requires the Android development environment configured for Expo):

```bash
npm run android
```

Run on iOS (requires the relevant Apple development environment):

```bash
npx expo run:ios
```

## Web production export

Build static web assets into the `dist/` directory:

```bash
npx expo export --platform web
```

Deploy the contents of `dist/` to a static hosting provider. Configure the host to serve the app entry point for client-side routes if required by the hosting provider.

## Quality checks

Run lint:

```bash
npm run lint
```

Run the TypeScript compiler check:

```bash
npx tsc --noEmit
```

These commands are provided as project checks; their passing status depends on the source and installed dependency versions in the environment where they are run.

## Account data and backup handling

- Deleting an account removes that account from the current local vault; it does not remove the account from the service it protects.
- Restoring a backup merges accounts instead of replacing the current vault. Duplicate records are skipped, and existing local records are retained.
- Maintain a separate secure backup before changing devices, reinstalling the app, or clearing browser data.
- Test that a backup can be restored before relying on it as your only recovery method.

## License

See [`LICENSE`](./LICENSE) for the license included with this source bundle.
