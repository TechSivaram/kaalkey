# GitHub Actions desktop and Android build fixes

## Android SDK setup

The mobile workflow uses `android-actions/setup-android@v4` and explicitly requests
`platform-tools`. The retired Android SDK `tools` package must not be requested;
current command-line tools are installed by the setup action.

## Desktop native asset pruning

Expo packages can contain iOS Swift Package Manager payloads under `spm-deps`.
These are not required by the Electron desktop app. They previously leaked into
Windows packaging (causing WiX to fail while processing iOS framework `Info.plist`
files) and macOS universal merging (where an iOS framework appeared in both arch
packages and could not be merged).

All desktop packaging scripts now run
`scripts/prune-desktop-native-assets.cjs` after the web export and before Electron
Builder/Snap packaging. The Electron Builder `files` list also excludes
`!**/spm-deps/**` as a secondary safeguard. This script only removes `spm-deps`
directories inside `node_modules` on desktop build jobs; it does not run in Android
or iOS native build jobs.

## macOS icon

The existing macOS workflow already creates `build/kaalkey.icns` from
`build/icons/1024x1024.png`; that step was retained rather than duplicated.
