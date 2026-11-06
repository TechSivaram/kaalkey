# KaalKey Desktop

KaalKey Desktop reuses the existing Expo/React Native Web application inside Electron. There is no second account/vault implementation.

## Development

```bash
npm install
npm run desktop:dev
```

Expo starts the web renderer on localhost:8081 and Electron opens it as the desktop shell.

## Build

```bash
npm install
npm run desktop:build
```

The production web bundle is exported to `dist/` and Electron Builder writes installers to `release/`.

## Desktop lock

- First launch asks for a 6–12 digit desktop PIN.
- The PIN is salted and hashed in the Electron main process and is never exposed to the renderer as stored plaintext.
- The vault locks after 5 minutes without user activity.
- Minimizing/backgrounding the Electron window also locks the vault.
- Unlock happens through the desktop PIN screen.
- Account data continues to use the existing application storage/data layer, so the desktop app remembers its accounts between launches.

The desktop PIN implementation is deliberately isolated behind `src/platform/desktop` so a platform-native biometric/OS-authenticator implementation can be added later without changing the vault UI or account logic.
