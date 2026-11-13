# KaalKey Authenticator Privacy Policy

**Effective date:** 13 November 2026

KaalKey Authenticator is an authenticator application for creating time-based
one-time passwords (TOTP). This policy describes the data handling visible in the
KaalKey source code distributed with this release.

## Authenticator data

Account names, issuer labels and TOTP secrets are stored locally by the app. The
application does not implement an account-sync service or a server-side account
vault. On Android and iOS, the app uses Expo SecureStore. The web renderer, including
the Electron desktop app, uses origin-scoped browser `localStorage` within the app
profile. These storage mechanisms have different security properties; in particular,
localStorage is not equivalent to an operating-system secure enclave or keychain.
Protect access to your device and operating-system account.

## Network requests

The source includes an optional remote language catalogue and translation download
feature. Its default service is `https://techsivaram.com/kaalkey/i18n`; language
metadata and translation files may be requested and cached locally. The language
request code does not pass authenticator account records or TOTP secrets as request
payloads. The source does not implement cloud synchronization of authenticator
accounts. Network infrastructure may process ordinary connection data such as IP
address and request metadata; consult the service host's policies for its handling.

## Backups

The backup flow exports an encrypted backup file and generates a high-entropy backup
password. The backup file contains encrypted account data. Users are responsible for
keeping the backup file and password private and separate. KaalKey cannot recover a
forgotten backup password. Do not send backup files, passwords, setup QR codes or
TOTP secrets to people you do not trust.

## Clipboard, camera and files

Clipboard operations occur when the user invokes copy or paste features. QR scanning
uses the camera where supported and permitted by the operating system. Backup
creation, restore and QR-image import use local file and sharing interfaces. Data
placed on the system clipboard may be accessible to other applications according
to the operating system's clipboard behavior.

## Analytics and advertising

No analytics or advertising SDK is declared in the inspected application dependency
manifest. This statement is limited to the source and dependencies reviewed for this
release; it is not a claim that the operating system or network provider performs no
independent diagnostics.

## Children's privacy

KaalKey is a general-purpose authenticator and is not designed to collect personal
information from children.

## Changes and contact

This policy may be updated when app behavior changes. For questions or privacy
requests, contact **sivaram@techsivaram.com** or open an issue at
https://github.com/TechSivaram/kaalkey/issues.
