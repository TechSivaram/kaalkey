# Snap Store listing package

This file contains the listing text and media prepared for the KaalKey Authenticator
Snap. The package build can embed the app icon and technical metadata, but the
public Store listing (categories, screenshots, publisher details and any keyword
fields exposed by the dashboard) must still be reviewed and saved in the Snap Store
publisher dashboard. Uploading a Snap does not automatically publish these fields.

## Listing identity

- **Snap name:** `kaalkey-authenticator`
- **Display title:** KaalKey Authenticator
- **Publisher:** TechSivaram (`sivaram-movva`)
- **License:** MIT
- **Website / source:** https://github.com/TechSivaram/kaalkey
- **Support:** https://github.com/TechSivaram/kaalkey/issues
- **Contact:** sivaram@techsivaram.com
- **Privacy policy:** https://github.com/TechSivaram/kaalkey/blob/main/docs/privacy-policy.md
- **Suggested categories:** `security`, `utilities`

## Summary

TOTP authenticator for managing two-factor authentication codes

## Description

KaalKey Authenticator is a time-based one-time password (TOTP) authenticator for
two-factor authentication (2FA) and multi-factor authentication (MFA). Generate
one-time passwords (OTP) for your accounts and keep verification codes close at
hand when signing in.

**Features**

- Generate time-based one-time passwords (TOTP).
- Support SHA-1, SHA-256 and SHA-512 TOTP algorithms.
- Add accounts by scanning QR codes, importing supported QR images, pasting
  supported `otpauth://` setup URLs, or entering details manually.
- Manage multiple authenticator accounts.
- Copy verification codes to the clipboard.
- Create password-protected backups and restore accounts.

KaalKey is an authenticator app for generating OTP verification codes. It does not
approve sign-ins on behalf of a service and does not recover an account if its
second-factor setup is lost. KaalKey does not implement cloud account synchronization.

Keep authenticator secrets, setup QR codes, backup files and backup passwords
private. Storage protections vary by platform; see the privacy policy for details.

## Search phrases to include naturally

The Snap Store listing does not receive these as a `snapcraft.yaml` `keywords` key.
Use the terms naturally in the title, summary and description, and use the Store
dashboard's keyword field if it is available to this publisher:

- TOTP
- OTP
- authenticator
- time-based one-time password
- one-time password
- 2FA
- two-factor authentication
- MFA
- multi-factor authentication
- verification code
- security code
- QR authenticator

## Listing media

- **Snap icon:** `store-assets/kaalkey-snap-icon-256.png` (256 x 256 PNG)
- **Gallery screenshots:** `store-assets/screenshots/`
  1. `01-account-list-otp.png`
  2. `02-add-account.png`
  3. `03-app-settings.png`
  4. `04-create-backup.png`
  5. `05-restore-backup.png`

These gallery files are copied from the existing repository screenshots; no mock UI
or fabricated screenshots were created. Review them at full size before uploading.
The existing `docs/screenshots/kaalkey-web-desktop.png` is also available as a
desktop preview, but it contains browser chrome and should be replaced with a clean
Electron screenshot if a desktop-only gallery is required.

## Before submitting

1. Confirm the Snap icon and gallery images in the publisher dashboard.
2. Confirm the MIT licence and source/support/privacy URLs.
3. Confirm all feature claims against the actual release build.
4. Test clipboard, backup restore and GTK file chooser in the built strict Snap.
5. Submit the listing and Snap revision for Store review.
