# Linux distribution

KaalKey produces these Linux formats from the same Electron desktop build:

- `.deb` for Debian/Ubuntu and the signed APT repository.
- `.rpm` for RPM-based distributions.
- `.AppImage` for portable Linux use.
- `.snap` for Snap-enabled distributions and the Snap Store.
- `.flatpak` for Flatpak-compatible distributions.

## Local builds

```bash
npm ci
npm run desktop:export
npx electron-builder --linux AppImage deb rpm --publish never
node scripts/fix-linux-packages.cjs
node scripts/build-snap.cjs --publish never
npx electron-builder --linux flatpak --publish never
```

The Flatpak target uses the Freedesktop 25.08 runtime, SDK and Electron BaseApp.
The bundle is built locally with electron-builder; a Flathub submission is a
separate review and publishing process and is not performed by the GitHub
Release workflow. The Flatpak manifest grants Wayland/X11 display access, GPU
access, downloads-folder access and PipeWire/desktop-portal access for camera
workflows. Camera availability still depends on the host desktop portal and
PipeWire implementation, and must be tested on each target desktop.

Snap builds require Snapcraft and an available build provider. CI uses LXD;
configure and verify LXD networking before invoking the Snap build. The Snap
uses the Core24 base and strict confinement. Its camera interface must be
connected by the Store or the user where the platform requires it.

## GitHub release workflow

Pushing a version tag such as `v1.1.26` runs
`.github/workflows/linux-release.yml`. It builds DEB, RPM, AppImage, Snap and
Flatpak packages for the configured architectures and attaches them to the
GitHub Release. The workflow validates Flatpak metadata and package identity,
installs each bundle in CI, checks its architecture and performs a headless
Electron startup smoke test. A headless test does not replace camera testing
on a real Wayland/X11 desktop.

## Signed APT repository

The repository is published to GitHub Pages by
`.github/workflows/publish-apt.yml` (run manually from Actions). Before running
it:

1. Enable GitHub Pages for the repository and select **GitHub Actions** as the source.
2. Generate a dedicated APT signing key outside CI. Keep its private key secure.
3. Add the ASCII-armored private key as the `APT_SIGNING_KEY` Actions secret. Add `APT_SIGNING_KEY_PASSPHRASE` if the key is protected by a passphrase.
4. Run the workflow after at least one GitHub Release contains a `.deb` asset.
5. Publish the exported public key (`kaalkey-archive-keyring.asc`) over HTTPS and verify its fingerprint through a separate trusted channel before users install it.

Example client setup (replace the URL with the actual GitHub Pages URL and verify the key fingerprint first):

```bash
curl -fsSL https://TECHSIVARAM.github.io/kaalkey/kaalkey-archive-keyring.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/kaalkey-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/kaalkey-archive-keyring.gpg] https://TECHSIVARAM.github.io/kaalkey stable main" \
  | sudo tee /etc/apt/sources.list.d/kaalkey.list

sudo apt update
sudo apt install kaalkeyauthenticator
```

The repository workflow currently publishes `amd64` packages only. Do not claim
APT support for additional architectures until their indexes are published.

## Snap Store publication

The Snap Store publisher account must register the snap name and complete the
initial Store setup. Generate an exported Snapcraft login assertion using
`snapcraft export-login` and store it as the
`SNAPCRAFT_STORE_CREDENTIALS` GitHub Actions secret. Then run
`.github/workflows/publish-snap.yml` manually. The workflow uploads the latest
`.snap` release asset to the stable channel.

## Flathub publication

GitHub Releases currently distribute standalone `.flatpak` bundles. They do not
submit KaalKey to Flathub. Flathub publication requires a separate app
submission repository, review of the manifest and metadata, and maintenance of
updates according to Flathub's process. Do not describe the GitHub Release
workflow as Flathub publishing.

Never commit APT private keys, Snapcraft credentials or other publishing
secrets to the repository.
