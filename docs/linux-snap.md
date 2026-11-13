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

The build script verifies that the generated Snapcraft project includes the Core24
GNOME runtime and the `gtk-3-themes` and `icon-themes` content plugs before packing.
It also copies the dedicated 256x256 KaalKey icon into the Snap metadata.

## Clipboard integration

KaalKey retains its shared `expo-clipboard` implementation across desktop, web,
Android, and iOS. There is no Electron-specific clipboard IPC bridge and no
Snap-specific clipboard implementation. The Snap package uses the same clipboard
code as the other desktop packages. No dedicated general-purpose Snap `clipboard`
plug exists; do not add an invented clipboard plug. If clipboard access fails only
inside the installed Snap, investigate the confined runtime and desktop session
rather than replacing the shared clipboard implementation.

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
