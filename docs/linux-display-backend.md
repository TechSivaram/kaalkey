# KaalKey Desktop: Linux Wayland and X11 startup

## Purpose

KaalKey Desktop uses Electron, which embeds Chromium. Chromium's Ozone display backend must be selected **when the Electron process starts**. Selecting it later from the application entry point (`main.cjs`) is too late for reliable backend initialization and can cause display or drag-and-drop problems.

The Linux startup code therefore detects the current graphical session and passes the appropriate Chromium argument to Electron before the application main process is loaded.

## Backend selection

The shared detection logic is in `electron/display-backend.cjs`:

| Environment                                      | Selected backend | Electron argument          |
| ------------------------------------------------ | ---------------- | -------------------------- |
| Linux Wayland session with XWayland available    | X11              | `--ozone-platform=x11`     |
| WSLg with both `WAYLAND_DISPLAY` and `DISPLAY`   | Wayland          | `--ozone-platform=wayland` |
| Linux with only `WAYLAND_DISPLAY`                | Wayland          | `--ozone-platform=wayland` |
| Linux without Wayland, with `DISPLAY` set        | X11              | `--ozone-platform=x11`     |
| Linux with neither variable set; Windows / macOS | Electron default | No Ozone argument          |

Native Wayland does not allow applications to choose a top-level window's screen position. KaalKey uses XWayland when both session sockets are available so its default sidebar can be sized and aligned to the right edge. WSLg keeps using Wayland because that path has been tested. If only Wayland is available, the compositor controls the window position.

An explicitly supplied `--ozone-platform` argument is respected rather than overridden by automatic detection.

## Files and responsibilities

### `electron/display-backend.cjs`

Shared, side-effect-free helper functions:

- `getDetectedOzoneArgs()` selects the Ozone argument based on platform and environment variables.
- `getExplicitOzoneArgs()` detects a caller-supplied Ozone argument.
- `describeBackend()` provides a short backend description for diagnostics.

Both development and packaged startup use this module so their selection rules stay consistent.

### `electron/launch.cjs` — development startup

The `desktop:dev` script starts Expo and then runs `node electron/launch.cjs`.

`launch.cjs`:

1. Reads any explicitly supplied Ozone argument.
2. Otherwise calls the shared detection helper.
3. Starts the Electron executable with the selected Ozone argument **before** `electron/main.cjs`.
4. Forwards remaining command-line arguments and inherits the current environment and terminal streams.

### `electron/bootstrap.cjs` — packaged application startup

The Electron Builder configuration sets the packaged application's main entry point through `build.extraMetadata.main` to `electron/bootstrap.cjs`.

For a detected Linux graphical backend, `bootstrap.cjs` starts the packaged Electron executable again with the Ozone argument placed before the original application arguments. The bootstrap process then exits. This ensures Chromium receives the setting at process startup. If an Ozone argument was explicitly supplied, no display session was detected, or the platform is not Linux, it loads `electron/main.cjs` directly.

### `electron/main.cjs` — application main process

`main.cjs` remains responsible for the KaalKey Electron application: window creation, IPC, lock/PIN handling, protocol setup, and renderer loading. It is not responsible for late Ozone backend selection.

## Package configuration

The relevant Electron Builder setting is:

```json
"extraMetadata": {
  "main": "electron/bootstrap.cjs"
}
```

The `electron/**/*` files must be included in the packaged application. The Linux package must not force a single backend through a global `executableArgs` setting; the bootstrap chooses the backend at runtime instead.

## Build commands

Export the Expo web renderer and build for the operating system on which the command is run:

```bash
npm run desktop:build
```

For an explicit Linux build (when running in a Linux build environment):

```bash
npm run desktop:build:linux
```

The Linux builder configuration declares AppImage, DEB, and RPM targets. The `desktop:build:linux` script is a convenience for explicitly targeting Linux; it is not required for the display-backend detection itself.

## Linux package formats (AppImage, DEB, RPM)

The `build.linux.target` list in `package.json` declares all Linux distributables:

```json
"linux": {
  "target": [
    "AppImage",
    "deb",
    "rpm"
  ]
}
```

The universal build command exports the Expo web renderer and then builds the targets for the current operating system. When run in Linux, it produces the configured Linux packages:

```bash
npm run desktop:build
```

To explicitly build all configured Linux targets from a Linux build environment:

```bash
npm run desktop:build:linux
```

To build only one Linux format (after running `npm run desktop:export`):

```bash
npx electron-builder --linux AppImage
npx electron-builder --linux deb
npx electron-builder --linux rpm
```

The generated packages are written to `release/` (as configured by `build.directories.output`). Typical output extensions are `.AppImage`, `.deb`, and `.rpm`.

### Install and uninstall packages

**DEB (Ubuntu, Debian and derivatives):**

```bash
sudo apt install ./release/<generated-package>.deb
sudo apt remove kaalkeyauthenticator
```

**RPM (Fedora, RHEL-compatible distributions and other RPM-based systems):**

```bash
sudo dnf install ./release/<generated-package>.rpm
sudo dnf remove kaalkeyauthenticator
```

**AppImage (portable):**

```bash
chmod +x "./release/KaalKey Authenticator-1.3.0.AppImage"
"./release/KaalKey Authenticator-1.3.0.AppImage"
```

The AppImage does not use the system package manager. Some distributions may require FUSE support to run AppImages.

### RPM build notes

- Build the RPM from a Linux build environment (for example, Ubuntu/WSL or Fedora) with the project's dependencies installed.
- If RPM packaging reports that the RPM build tool is missing, install the RPM build utilities for the build distribution (for example, `rpm` on Ubuntu/Debian or `rpm-build` on Fedora).
- Building an RPM does not require running Fedora, but the resulting package should be installed and tested on a supported RPM-based distribution before release.
- Test the installed RPM's normal desktop/menu launch, UI rendering, and drag-and-drop. The packaged Linux bootstrap should select Wayland or X11 at startup based on the session environment.

## Verification

### 1. Inspect the current Linux session

```bash
echo "WAYLAND_DISPLAY=$WAYLAND_DISPLAY"
echo "DISPLAY=$DISPLAY"
```

On Fedora Wayland, both variables should normally be set and KaalKey should choose X11 for reliable window positioning. WSLg also exposes both variables but continues to use Wayland.

### 2. Verify development startup

```bash
npm run desktop:dev
```

The launcher should log the Ozone argument it selected. Confirm that the UI appears and test file/QR drag-and-drop.

### 3. Verify the packaged DEB

Build the DEB, install it, and launch without manually specifying an Ozone argument:

```bash
npm run desktop:build:linux
sudo apt install ./release/<generated-package>.deb
kaalkeyauthenticator
```

Confirm that the UI appears and drag-and-drop works. To compare against the known-good explicit invocation in a Wayland session, run:

```bash
kaalkeyauthenticator --ozone-platform=wayland
```

### 4. Verify the default window placement

On Fedora Wayland, confirm both `WAYLAND_DISPLAY` and `DISPLAY` are set, then launch KaalKey normally. It should use XWayland and place the sidebar on the right. A simulated environment-variable test only verifies backend selection; it does not prove the full application works on a real Fedora desktop.

## Verified behavior and remaining coverage

- **Verified by user in WSLg:** Wayland launch, UI rendering, and drag-and-drop work when the packaged application is launched normally through the updated bootstrap.
- **Expected, not yet independently verified here:** Fedora Wayland sessions with XWayland available use X11 so the sidebar can be positioned. The packaged app should still be tested on a real Fedora desktop.
- **Windows and macOS:** The Linux-specific detection helper does not add Ozone arguments on these platforms; continue testing their normal build and launch paths as part of release validation.

## Troubleshooting

- If the UI or drag-and-drop fails only in the installed package, check that the packaged `package.json` points to `electron/bootstrap.cjs` and that `electron/bootstrap.cjs` plus `electron/display-backend.cjs` are included in the package.
- If right-edge placement is unavailable, check whether `DISPLAY` is set and XWayland is installed/enabled. Without XWayland, the Wayland compositor controls app placement.
- An explicit `--ozone-platform=wayland` argument remains available, but the compositor may ignore KaalKey's requested position.
- Do not move Ozone selection into `app.commandLine.appendSwitch()` in `main.cjs`; the argument needs to reach Chromium at process startup.
- Do not add a fixed Linux `executableArgs` value; runtime detection selects the backend.
