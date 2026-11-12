# Linux Snap packaging

KaalKey builds its strict Core24 Snap with electron-builder's GNOME extension.
The extension supplies the shared GTK, desktop, and GPU runtime integration;
the project intentionally does not maintain a long list of individual
`stagePackages`.

The Snap build uses LXD because Snapcraft's GNOME extension is incompatible
with destructive mode.

## Local build on Ubuntu / WSL2

Install and initialize LXD once:

```bash
sudo snap install lxd
sudo usermod -aG lxd "$USER"
newgrp lxd
lxd init --minimal
```

Then build:

```bash
npm ci
npm run desktop:snap
```

If the current shell was opened before adding the user to the `lxd` group,
start a new shell or run `newgrp lxd` before building.

The Snap keeps the `camera` plug in addition to electron-builder's default
Electron plugs. Review connections on the target system with:

```bash
snap connections kaalkey-authenticator
```
