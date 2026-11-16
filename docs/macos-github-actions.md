# KaalKey macOS desktop builds with GitHub Actions

The `KaalKey macOS desktop builds` workflow builds the Electron desktop application on a GitHub-hosted macOS runner. It is separate from the iOS workflow: the iOS job builds the native iPhone/iPad app, while this workflow builds the macOS Electron app.

## Outputs

- `.dmg`: standard drag-and-drop installer for macOS.
- `.zip`: packaged macOS application archive.
- Both are built as a universal binary for Intel (`x64`) and Apple Silicon (`arm64`) Macs.

## Run the workflow

1. Push the updated source to GitHub.
2. Open **Actions → KaalKey macOS desktop builds**.
3. Select **Run workflow** to build without creating a release.
4. Download `kaalkey-macos-universal` from the workflow run's Artifacts section.

When a `v*` tag is pushed, the workflow builds the packages and attaches them to the corresponding GitHub Release.

## Signing status

This workflow intentionally builds unsigned packages because Apple Developer distribution credentials are not configured. Users may see macOS Gatekeeper warnings when opening the app downloaded from GitHub. The workflow disables automatic certificate discovery; it does not create a trusted Developer ID signature or notarize the app.

When Developer ID credentials become available, signing and notarization can be added using protected GitHub Actions secrets. Do not commit certificates or private keys to the repository.
