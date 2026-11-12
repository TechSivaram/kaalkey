# Linux distribution

KaalKey produces the following Linux formats from the same Electron desktop build:

- `.deb` for direct Debian/Ubuntu installation and the signed APT repository.
- `.rpm` for RPM-based distributions.
- `.AppImage` for portable Linux use.
- `.snap` for Snap-enabled distributions and the Snap Store.

## Local builds

```bash
npm ci
npm run desktop:export
npx electron-builder --linux AppImage deb rpm snap
node scripts/fix-linux-packages.cjs
```

Snap builds require a Linux build environment with Snapcraft available. The Snap uses the `core24` base and strict confinement. The camera plug is declared because KaalKey supports QR-code scanning; the user may need to connect the camera interface on systems where it is not auto-connected.

## GitHub release workflow

Pushing a version tag such as `v1.1.23` runs `.github/workflows/linux-release.yml` and attaches the Linux packages to the GitHub Release. The existing `desktop:build` command remains unchanged.

## Signed APT repository

The repository is published to GitHub Pages by `.github/workflows/publish-apt.yml` (run manually from Actions). Before running it:

1. Enable GitHub Pages for the repository and select **GitHub Actions** as the source.
2. Generate a dedicated APT signing key outside CI. Keep its private key secure.
3. Add the ASCII-armored private key as the `APT_SIGNING_KEY` Actions secret. Add `APT_SIGNING_KEY_PASSPHRASE` if the key is protected by a passphrase.
4. Run the workflow after at least one GitHub Release contains a `.deb` asset.
5. Publish the exported public key (`kaalkey-archive-keyring.asc`) to users over HTTPS and verify its fingerprint through a separate trusted channel before users install it.

Example client setup (replace the URL with the actual GitHub Pages URL and verify the key fingerprint first):

```bash
curl -fsSL https://TECHSIVARAM.github.io/kaalkey/kaalkey-archive-keyring.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/kaalkey-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/kaalkey-archive-keyring.gpg] https://TECHSIVARAM.github.io/kaalkey stable main" \
  | sudo tee /etc/apt/sources.list.d/kaalkey.list

sudo apt update
sudo apt install kaalkeyauthenticator
```

The repository workflow currently publishes `amd64` packages only. Add additional architecture indexes before claiming support for other architectures.

## Snap Store publication

The Snap Store publisher account must first register the chosen snap name and complete the initial Store setup. Generate an exported Snapcraft login assertion using `snapcraft export-login` and store its contents as the `SNAPCRAFT_STORE_CREDENTIALS` GitHub Actions secret. Then run `.github/workflows/publish-snap.yml` manually. The workflow uploads the latest `.snap` release asset to the stable channel.

Do not commit APT private keys, Snapcraft credentials, or other publishing secrets to the repository.
