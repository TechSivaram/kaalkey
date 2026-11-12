<div align="center">

# 🐧 KaalKey on Linux · WSL2

### Build, install, and run the KaalKey desktop app from Ubuntu on Windows

A practical guide for building the **KaalKey Electron desktop application** on **Ubuntu 24.04 running under WSL2**, launching it through **WSLg**, and enabling webcam access for QR-code scanning.

[![Linux](https://img.shields.io/badge/Linux-Ubuntu%2024.04-E95420?style=flat-square&logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![WSL2](https://img.shields.io/badge/Windows-WSL2-0078D4?style=flat-square&logo=windows&logoColor=white)](https://learn.microsoft.com/windows/wsl/)
[![Desktop](https://img.shields.io/badge/Desktop-Electron-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Expo](https://img.shields.io/badge/App-Expo%20%2B%20React%20Native-4630EB?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)

</div>

---

## 📌 What this guide covers

- Prepare Ubuntu 24.04 under WSL2.
- Install project dependencies.
- Export the Expo web renderer and package the Electron desktop app.
- Generate Linux **AppImage** and **DEB** packages.
- Install and launch KaalKey through WSLg.
- Pass a USB webcam from Windows into WSL2.
- Verify camera access and scan authenticator QR codes.

> **Scope:** This document is specifically for the Linux desktop build and WSL2 workflow. It is not the general KaalKey development README.

## 🧭 How the setup works

```text
Windows 11
└── WSL2
    └── Ubuntu 24.04
        ├── Node.js + npm
        ├── KaalKey Expo / React Native project
        ├── Electron + electron-builder
        ├── Linux packages
        │   ├── AppImage
        │   └── DEB
        └── WSLg
            └── KaalKey desktop window
```

WSLg displays Linux GUI applications directly on the Windows desktop. You do not need to install or run a complete Ubuntu desktop environment.

## 1. Prepare WSL2 and Ubuntu

Run these commands in **Administrator PowerShell** on Windows if WSL2 or Ubuntu is not already installed:

```powershell
wsl --install -d Ubuntu-24.04
```

Restart Windows if requested, launch Ubuntu, and complete its first-run username/password setup.

Update Ubuntu:

```bash
sudo apt update
sudo apt upgrade -y
```

Confirm the distribution:

```bash
lsb_release -a
```

The build workflow documented here was exercised on Ubuntu 24.04 under WSL2.

## 2. Install system dependencies

```bash
sudo apt install -y \
  build-essential \
  git \
  curl \
  wget \
  unzip \
  xz-utils \
  libfuse2t64 \
  v4l-utils
```

`libfuse2t64` provides the FUSE 2 compatibility library needed by many AppImage runtimes on Ubuntu 24.04.

`v4l-utils` provides tools for inspecting Linux Video4Linux camera devices.

## 3. Install Node.js

Install the Node.js version required by the project. Check the repository's `package.json` and any `.nvmrc` or tool-version file before choosing a version.

Verify the installation:

```bash
node --version
npm --version
```

## 4. Get the KaalKey source

Keep the project inside the WSL Linux filesystem (for example, under `~/KaalKey`) rather than building from `/mnt/c` where possible. This generally avoids cross-filesystem performance and file-permission issues.

```bash
cd ~
git clone https://github.com/TechSivaram/kaalkey.git KaalKey
cd ~/KaalKey
```

If you already have the project in WSL, simply change to its project directory.

Install dependencies:

```bash
npm ci
```

Use `npm install` instead if the repository does not contain a usable lockfile.

## 5. Build the Linux desktop packages

KaalKey uses the shared Expo / React Native application for its renderer and Electron for the desktop shell.

The Linux build script runs the web export first, then invokes Electron Builder:

```bash
npm run desktop:build:linux
```

The underlying steps are:

```bash
npm run desktop:export
npx electron-builder --linux
```

The configured Linux targets are:

| Package     | Purpose                                                           |
| ----------- | ----------------------------------------------------------------- |
| `.AppImage` | Portable Linux application package                                |
| `.deb`      | Installable package for Debian-based distributions such as Ubuntu |

Build output is written to the configured release directory (in this setup, `release/`).

Example output for version `1.1.23`:

```text
release/
├── KaalKey Authenticator-1.1.23.AppImage
└── kaalkeyauthenticator_1.1.22_amd64.deb
```

Filenames change when the application version or build configuration changes.

## 6. Install and launch the DEB package

From the project directory, install the generated package. Substitute the actual filename produced by your build:

```bash
sudo apt install ./release/kaalkeyauthenticator_VERSION_amd64.deb
```

Check that Ubuntu registered the package:

```bash
dpkg -l | grep -i kaalkey
```

Launch the application:

```bash
kaalkeyauthenticator
```

With WSLg enabled, the KaalKey window should appear on the Windows desktop.

## 7. Run the AppImage

Make the generated AppImage executable:

```bash
chmod +x "release/KaalKey Authenticator-VERSION.AppImage"
```

Launch it:

```bash
"./release/KaalKey Authenticator-VERSION.AppImage"
```

### If the AppImage reports a FUSE error

On Ubuntu 24.04, install the compatibility package:

```bash
sudo apt update
sudo apt install -y libfuse2t64
```

Then retry the AppImage.

## 8. Enable webcam access in WSL2

A webcam connected to Windows is not automatically exposed as a Linux `/dev/video*` device inside WSL2. For a USB webcam, `usbipd-win` can attach the device to WSL.

> **Important:** While a USB device is attached to WSL, it may no longer be available to Windows applications. Detach it when you want Windows to use it again.

### 8.1 Install usbipd-win on Windows

Open **Administrator PowerShell**:

```powershell
winget install --interactive --exact dorssel.usbipd-win
```

If it is already installed, skip this step.

### 8.2 Find the webcam

In PowerShell:

```powershell
usbipd list
```

Identify the webcam by its description and VID:PID. In the tested setup, the Logitech C270 appeared as:

```text
046d:0825
```

The BUSID is assigned by the current USB topology and can change. Do not assume it will always be `3-3`.

### 8.3 Bind and attach the webcam

In **Administrator PowerShell**, replace `BUSID` with the value shown by `usbipd list`:

```powershell
usbipd bind --busid BUSID
usbipd attach --wsl --busid BUSID
```

For example, the tested device was attached with:

```powershell
usbipd bind --busid 3-3
usbipd attach --wsl --busid 3-3
```

### 8.4 Verify the camera in Ubuntu

Back in Ubuntu:

```bash
ls /dev/video*
```

List detected cameras:

```bash
v4l2-ctl --list-devices
```

Inspect the first video device:

```bash
v4l2-ctl -d /dev/video0 --all
```

The tested Logitech C270 appeared as a UVC camera with `/dev/video0` and `/dev/video1`. Device numbering can differ on other systems.

### 8.5 Fix camera permission errors

If the current user cannot access `/dev/video0`, add the user to the `video` group:

```bash
sudo usermod -aG video "$USER"
```

Apply the new group membership in the current shell:

```bash
newgrp video
```

Check the device permissions and retry the V4L2 commands.

If the device still does not appear, recheck `usbipd list` in Windows and confirm that the webcam is attached to WSL.

## 9. Test the camera stream (optional)

Install FFmpeg:

```bash
sudo apt install -y ffmpeg
```

Capture a short test clip:

```bash
ffmpeg \
  -f v4l2 \
  -video_size 640x480 \
  -framerate 30 \
  -i /dev/video0 \
  -t 5 \
  -c:v libx264 \
  /tmp/camera-test.mp4
```

This tests whether Linux can read frames from the webcam. The camera may expose more than one video node; if `/dev/video0` is not the capture node, inspect the formats and capabilities with `v4l2-ctl`.

## 10. Verify QR scanning in KaalKey

After the webcam is visible in Ubuntu:

1. Launch KaalKey from the Ubuntu terminal:

   ```bash
   kaalkeyauthenticator
   ```

2. Open the QR-code scanner in KaalKey.
3. Allow camera access if the application asks for permission.
4. Present an authenticator provisioning QR code to the webcam.
5. Confirm that KaalKey reads the account details and adds the authenticator entry.

The WSL2 test setup successfully scanned a TOTP QR code using the Logitech C270 after USB/IP attachment and Linux camera permission setup.

## 🛠️ Troubleshooting

| Symptom                              | Likely cause                                                                   | What to try                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| App window does not appear           | WSLg unavailable or app launch failed                                          | Confirm WSLg works with another Linux GUI app; launch KaalKey from the terminal and inspect errors |
| AppImage reports missing FUSE        | FUSE 2 compatibility library missing                                           | Install `libfuse2t64`                                                                              |
| AppImage is not executable           | Execute permission missing                                                     | Run `chmod +x` on the AppImage                                                                     |
| No `/dev/video*` devices             | Webcam is not attached to WSL                                                  | Check `usbipd list`, then bind and attach the USB webcam                                           |
| Camera access is denied              | User lacks video-device permissions                                            | Add the user to the `video` group and start a shell with `newgrp video`                            |
| Camera is visible but QR scan fails  | Wrong video node, camera permission, focus, lighting, or QR presentation issue | Inspect the device with `v4l2-ctl`; test a clear, well-lit QR code                                 |
| Linux package build fails on Windows | Linux packaging tools or symlink behavior differ on Windows                    | Run the Linux build inside Ubuntu on WSL2                                                          |

## 🔁 Repeatable build checklist

Use this sequence for a fresh build:

```bash
cd ~/KaalKey
sudo apt update
npm ci
npm run desktop:build:linux
```

Install the DEB package:

```bash
sudo apt install ./release/kaalkeyauthenticator_VERSION_amd64.deb
```

Launch:

```bash
kaalkeyauthenticator
```

For camera testing, attach the USB webcam from Windows using `usbipd`, then verify it in Ubuntu with:

```bash
v4l2-ctl --list-devices
```

## ℹ️ Notes

- Build scripts, package names, output paths, and application version are controlled by the repository's current `package.json` and Electron Builder configuration.
- Replace example version strings and USB BUSIDs with the values from your own environment.
- WSL2 camera passthrough through USB/IP is intended for compatible USB devices. Built-in laptop cameras and virtual cameras may require a different setup.
- This guide documents the tested Ubuntu 24.04 + WSL2 workflow; other distributions and Linux desktop environments may require different package names or device setup.

---

<div align="center">

**KaalKey Authenticator** · Linux desktop build guide

[Repository](https://github.com/TechSivaram/kaalkey) · [Web demo](https://kaalkey.onrender.com)

</div>
