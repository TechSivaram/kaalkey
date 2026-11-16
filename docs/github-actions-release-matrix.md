# KaalKey GitHub Actions release builds

This repository uses native GitHub-hosted runners. Expo Application Services (EAS) Build and `EXPO_TOKEN` are not used by these workflows.

## Workflows

| Workflow | Runner | Outputs |
| --- | --- | --- |
| `mobile-release.yml` | Ubuntu + macOS | Signed Android APK and AAB; unsigned iOS `.xcarchive` ZIP and iOS Simulator `.app` ZIP |
| `build-macos-desktop.yml` | macOS | Universal Intel + Apple Silicon DMG and ZIP |
| `build-windows-installer.yml` | Windows | Windows NSIS EXE installer, portable EXE, and MSI |
| `linux-release.yml` | Ubuntu | DEB, RPM, AppImage, Snap, and Flatpak (amd64 and arm64 jobs) |

The repository also contains separate workflows for publishing Linux repositories and Snap packages. Those are publishing workflows and may require their own store/repository configuration.

## Running builds

- Push a tag matching `v*` (for example `v1.2.1`) to run the release workflows and attach their artifacts to the GitHub Release.
- Or open **Actions** in GitHub and manually run an individual workflow. Manual runs upload downloadable workflow artifacts but do not publish a GitHub Release.

## Android signing secrets

Configure these repository secrets under **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64`: Base64 text of the `kaalkey-release.jks` file.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: `kaalkey`.
- `ANDROID_KEY_PASSWORD`: key password. If `keytool` did not prompt for a separate key password during key generation, use the same password as the keystore password.

The workflow writes the decoded keystore to the runner's temporary directory, verifies the alias, configures Gradle signing, and removes it when the hosted runner is discarded. Never commit the keystore, Base64 text, or passwords.

Android `versionCode` is set to the GitHub Actions workflow run number for the mobile workflow. This increases across runs of that workflow. The workflow checks that the value is within Android's supported positive integer range.

Keep the same JKS file, alias, and passwords for every future Android release. Back up the keystore securely in more than one private location.

## iOS signing status

Without Apple distribution credentials, the iOS workflow builds:

- `kaalkey-ios.xcarchive.zip` with code signing disabled.
- `kaalkey-ios-simulator.app.zip` for Simulator testing.

It does not produce an App Store / TestFlight IPA. Add Apple Distribution certificate and provisioning profile configuration later when the Apple Developer Program account is available.

## Windows installer status

The Windows workflow creates NSIS and portable EXE outputs plus an MSI. They are unsigned until a trusted Windows code-signing certificate is configured. The MSI `upgradeCode` is explicitly stored in `package.json`; do not change it after distributing the first MSI, or Windows Installer may treat later releases as a different product.

## macOS desktop status

The macOS workflow builds universal Intel (`x64`) and Apple Silicon (`arm64`) DMG and ZIP packages. They are unsigned and not notarized until Apple Developer signing credentials are configured.

## Important release checks

1. Run each workflow manually before publishing a version tag.
2. Install and test the Android APK on a physical Android device.
3. Keep the Android signing keystore backed up securely.
4. Test Windows EXE and MSI installation and upgrades on a clean Windows VM.
5. Test macOS packages on both Intel and Apple Silicon hardware where possible.
6. Test Linux packages on their target distributions.
7. Confirm the app version in `package.json` and `app.json` before tagging a release.

GitHub-hosted runner builds have not been executed by editing this source archive. The first Actions run is the actual CI build validation.
