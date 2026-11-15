# Linux Snap packaging

KaalKey builds a strict Core24 Snap using electron-builder's Core24 GNOME extension.
The extension provides the GNOME/GTK runtime, icon and sound themes, GPU integration,
and desktop-session plugs needed by GTK dialogs and Electron.

**Do not build this Snap in destructive mode.** electron-builder disables the GNOME
extension when `useDestructiveMode` is enabled. The previous destructive-mode build
therefore omitted the shared icon-theme runtime; the resulting GTK file chooser could
abort when it tried to resolve missing symbolic icons.

## Local build on Ubuntu / WSL2

Install Snapcraft and LXD once:

```bash
sudo snap install snapcraft --classic
sudo snap install lxd
sudo lxd waitready --timeout=60
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
newgrp lxd
```

Then build from the project root:

```bash
npm ci
npm run desktop:snap
```

The project configures electron-builder for the Core24 base with LXD isolation.
The Core24 GNOME extension supplies the GTK runtime, desktop integration, and
icon-theme content plugs. The build script checks the generated Snap artifact.
The dedicated 256x256 KaalKey icon is included in Snap metadata.

## Clipboard integration

Desktop clipboard access uses Electron's main-process clipboard API through a
narrow preload bridge. The handler waits for the native write to complete so
platform errors are returned to the renderer rather than reported as success.
No dedicated general-purpose Snap `clipboard` plug exists; do not add an
invented clipboard plug. If clipboard access fails only inside the installed
Snap, inspect the confined runtime and desktop-session connections.

Desktop backup and QR-image selection use Electron's native file chooser rather
than Chromium file-input dialogs. Browser and mobile builds retain their existing
platform-specific pickers.

## Verify the installed Snap

```bash
snap connections kaalkey-authenticator
snap run kaalkey-authenticator
```

Test all of the following in the installed Snap, not only in a development build:

- Copy an OTP and paste it into another application.
- Create a backup and copy its generated password.
- Open Restore backup and select a `.kkbackup` file.
- Open the account QR/image import file picker.
- Test both Wayland and X11 sessions where available.

A successful package build does not prove these runtime flows work on every host.
