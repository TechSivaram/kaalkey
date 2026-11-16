# GitHub Actions build failure fixes

This update addresses the three errors shown in the supplied GitHub Actions screenshots.

1. Android SDK setup: `.github/workflows/mobile-release.yml` now uses `android-actions/setup-android@v4` and requests only `platform-tools`. The v3 action path in the previous workflow attempted to install the retired Android SDK `tools` package.
2. Windows MSI packaging: `package.json` Electron Builder `build.files` now excludes `!**/spm-deps/**`, preventing iOS Swift Package Manager assets (including `.framework.dSYM/Contents/Info.plist`) from entering the Windows application package and being processed by WiX.
3. macOS universal packaging: the same targeted exclusion prevents the duplicate iOS-only `ZXingObjC.framework` under Expo Camera's `spm-deps` directory from entering the x64/arm64 ASAR merge. The universal build target is retained.

No new CJS build or cleanup scripts were added. The Windows and macOS workflows continue to call their existing npm scripts and use the shared Electron Builder configuration.

Validation performed locally: package.json JSON parse and ZIP integrity. Actual GitHub-hosted Android, Windows, and macOS builds must still be rerun to confirm the CI results.
