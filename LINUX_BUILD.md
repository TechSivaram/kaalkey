# Building KaalKey Desktop for Ubuntu

The Linux build uses the existing Expo web export and Electron packaging setup.
It does not require a separate React Native project.

## Requirements

- Ubuntu 22.04 or newer (recommended)
- Node.js version compatible with this project's Expo dependencies
- npm

Install basic build tools:

```bash
sudo apt update
sudo apt install -y build-essential
```

## Build

From the project root:

```bash
npm ci
npm run desktop:build:linux
```

The script exports the Expo web renderer and then runs Electron Builder.
It produces both AppImage and Debian package targets in `release/`.

## Install and run the Debian package

```bash
sudo apt install ./release/*.deb
```

## Run the AppImage

```bash
chmod +x ./release/*.AppImage
./release/*.AppImage
```

## Notes

- The existing Windows `nsis` and `portable` targets are unchanged.
- Linux packaging uses `assets/images/kaalkey-logo-opaque.png` as its application icon.
- Build Linux packages on Linux for the most predictable results.
- This ZIP has not been built or runtime-tested on Ubuntu; run the commands above on an Ubuntu machine/CI runner and review any Electron Builder output.
