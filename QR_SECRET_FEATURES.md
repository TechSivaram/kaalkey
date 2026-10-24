KaalKey changes in this bundle
==============================

1. Editing an existing account makes its secret field read-only and hides the clear-secret control. To replace a secret, remove the account and add it again.
2. Each account card has a QR button. The first screen warns that revealing the QR exposes the TOTP secret; the user must tap Reveal QR code.
3. The QR encodes a local otpauth://totp URI generated from the account's stored issuer, account name, secret, algorithm, digits, and period.

Dependencies added:

- react-native-qrcode-svg
- react-native-svg

After extracting this bundle, run `npm install` to create a fresh package-lock.json and install dependencies. For an Expo-managed project, if Expo reports a version compatibility warning for react-native-svg, run `npx expo install react-native-svg` and then `npm install`.

Then run:
npx tsc --noEmit

This source change has not been compiled or runtime-tested in this environment. Verify QR scanning with a non-production test account before relying on it.
