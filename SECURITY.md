# Security Policy

## Reporting a vulnerability

Please do not publish authenticator secrets, backup files, backup passwords or
exploitable details in a public issue. Contact **sivaram@techsivaram.com** with a
clear description and reproduction steps, or use GitHub's private vulnerability
reporting feature if it is enabled for this repository.

## User safety notes

- Treat TOTP setup QR codes and secret keys like passwords.
- Keep encrypted backup files and their generated passwords private and separate.
- Protect the operating-system account that contains the KaalKey app profile.
- Desktop and web builds use browser-profile local storage; this is not equivalent
  to Android/iOS SecureStore.
- KaalKey has not been represented as independently security-audited or certified.
