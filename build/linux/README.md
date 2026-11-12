# KaalKey Linux production distribution

KaalKey publishes native Linux packages for **x86_64 (amd64)** and
**ARM64 (arm64/aarch64)**.

## Supported package formats

| Format | Distribution family | Architectures |
|---|---|---|
| AppImage | Portable Linux desktop | x86_64, ARM64 |
| DEB + signed APT repository | Ubuntu, Debian, Linux Mint | amd64, arm64 |
| RPM + signed RPM repository | Fedora, RHEL, openSUSE | x86_64, aarch64 |
| Snap + Snap Store | Snap-enabled distributions | amd64, arm64 |

Alpine/musl and 32-bit ARM are not included in this production target.

## Production build environment

GitHub Actions builds on native architecture runners:

- Ubuntu 22.04 x64 for x86_64 AppImage/DEB/RPM artifacts.
- Ubuntu 22.04 ARM64 for ARM64 AppImage/DEB/RPM artifacts.
- Ubuntu 24.04 x64 and ARM64 with LXD + Snapcraft for Core24 Snap artifacts.

Ubuntu 22.04 is the compatibility baseline for the non-Snap Linux packages.
Snap uses the Core24 base and its default GNOME extension. Do not add a
hand-maintained list of GTK/OpenGL/NSS/NSPR packages unless a reproducible
runtime test proves that the extension/base does not supply a required library.

## Create a production release

1. Update `package.json` version and commit the release changes.
2. Push a matching version tag. For example, if package.json is `1.1.24`:

   ```bash
   git tag v1.1.24
   git push origin v1.1.24
   ```

3. The `Production Linux release` workflow builds both architectures, checks
   package architecture metadata, generates `SHA256SUMS`, and attaches all
   packages to the GitHub Release.
4. Test the artifacts on real x86_64 and ARM64 installations before publishing
   them to the stable Snap channel or public package repositories.

The workflow also supports `workflow_dispatch` for test builds. Manual builds
are uploaded as a combined workflow artifact and are not published as releases.

## Publish the signed APT and RPM repositories

One combined Pages workflow deploys both repositories so two independent
workflows do not overwrite the same GitHub Pages site.

Repository setup (one time):

1. Enable GitHub Pages with **GitHub Actions** as its source.
2. Generate a dedicated GPG signing key outside CI.
3. Add the ASCII-armored private key as the Actions secret
   `REPO_SIGNING_KEY`.
4. If protected, add its passphrase as `REPO_SIGNING_KEY_PASSPHRASE`.
5. Run **Publish signed Linux package repositories** and provide the exact
   GitHub Release tag (for example `v1.1.24`).

The workflow publishes signed APT `InRelease` metadata for amd64 and arm64,
plus per-architecture RPM repositories with GPG-signed `repomd.xml` metadata.
The RPM repository enables metadata signature verification; package payloads
are integrity-checked against the signed repository metadata.

### APT client setup

Verify the public-key fingerprint through a separate trusted channel before
installing the key. Replace `TECHSIVARAM.github.io/kaalkey` if the Pages URL
for this repository differs.

```bash
curl -fsSL https://TECHSIVARAM.github.io/kaalkey/apt/kaalkey-archive-keyring.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/kaalkey-archive-keyring.gpg

echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/kaalkey-archive-keyring.gpg] https://TECHSIVARAM.github.io/kaalkey/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/kaalkey.list

sudo apt update
sudo apt install kaalkeyauthenticator
```

### RPM client setup

Verify the signing-key fingerprint independently before trusting it.

```bash
sudo rpm --import https://TECHSIVARAM.github.io/kaalkey/rpm/RPM-GPG-KEY-kaalkey

sudo tee /etc/yum.repos.d/kaalkey.repo >/dev/null <<'EOF'
[kaalkey]
name=KaalKey Authenticator
baseurl=https://TECHSIVARAM.github.io/kaalkey/rpm/$basearch/
enabled=1
gpgcheck=0
repo_gpgcheck=1
gpgkey=https://TECHSIVARAM.github.io/kaalkey/rpm/RPM-GPG-KEY-kaalkey
EOF

sudo dnf makecache
sudo dnf install kaalkeyauthenticator
```

On openSUSE, use the same repository file under `/etc/zypp/repos.d/kaalkey.repo`,
then run:

```bash
sudo zypper refresh
sudo zypper install kaalkeyauthenticator
```

## Publish to the Snap Store

One-time setup:

1. Register `kaalkey-authenticator` in the Snap Store and complete initial
   publisher setup.
2. Export Snapcraft login credentials using `snapcraft export-login`.
3. Store the assertion contents as the GitHub Actions secret
   `SNAPCRAFT_STORE_CREDENTIALS`.

Run **Publish Snap Store package** with an explicit release tag. Select
`candidate` first for validation. After testing the candidate on x86_64 and
ARM64 Snap systems, run the workflow again with `stable`.

## Required GitHub Actions secrets

| Secret | Used for |
|---|---|
| `REPO_SIGNING_KEY` | Signs APT and RPM repository metadata |
| `REPO_SIGNING_KEY_PASSPHRASE` | Optional signing-key passphrase |
| `SNAPCRAFT_STORE_CREDENTIALS` | Snap Store upload authentication |

Never commit private signing keys or Snap Store credentials to the repository.
