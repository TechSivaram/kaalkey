# KaalKey Linux production distribution

KaalKey publishes native Linux packages for **x86_64 (amd64)** and
**ARM64 (arm64/aarch64)**.

## Supported package formats

| Format                      | Distribution family        | Architectures   |
| --------------------------- | -------------------------- | --------------- |
| AppImage                    | Portable Linux desktop     | x86_64, ARM64   |
| DEB + signed APT repository | Ubuntu, Debian, Linux Mint | amd64, arm64    |
| RPM + signed RPM repository | Fedora, RHEL, openSUSE     | x86_64, aarch64 |
| Snap + Snap Store           | Snap-enabled distributions | amd64, arm64    |

Alpine/musl and 32-bit ARM are not included in this production target.

## Production build environment

GitHub Actions builds on native architecture runners:

- Native Ubuntu 24.04 x64 and ARM64 runners for AppImage/DEB/RPM artifacts.
- Native Ubuntu 24.04 x64 and ARM64 runners using Snapcraft Core24 with LXD
  isolation for Snap artifacts.

Ubuntu 22.04 is the compatibility baseline for the non-Snap Linux packages.
Snap uses the Core24 base and its default GNOME extension. Do not add a
hand-maintained list of GTK/OpenGL/NSS/NSPR packages unless a reproducible
runtime test proves that the extension/base does not supply a required library.

## Create a production release

1. Update `package.json` version and commit the release changes.
2. Push a matching version tag. For example, if package.json is `1.1.26`:

   ```bash
   git tag v1.1.24
   git push origin v1.1.24
   ```

3. The `Linux release packages` workflow builds both architectures and attaches
   DEB, RPM, AppImage and Snap files to the GitHub Release.
4. After a successful tagged release, GitHub Actions automatically publishes
   the Snap packages to the Snap Store `stable` channel and deploys the signed
   APT and RPM repositories to GitHub Pages.
5. AppImage files are automatically attached to the GitHub Release for direct
   download. GitHub Releases is the distribution channel for AppImage; there is
   no single universal AppImage app store.

## Automatic publishing after a version tag

Pushing a version tag such as `v1.1.25` starts the complete pipeline:

1. Build DEB, RPM and AppImage packages on native amd64 and arm64 runners.
2. Build Snap packages on native amd64 and arm64 runners using Snapcraft
   Core24 with LXD isolation and the GNOME extension.
3. Attach all generated packages to the GitHub Release.
4. After the release workflow succeeds, publish both Snap architectures to
   the Snap Store `stable` channel.
5. Deploy the signed multi-architecture APT and RPM repositories to GitHub
   Pages.

AppImage is distributed through the GitHub Release assets. No separate
AppImage Store upload is configured.

The Snap and repository publishing workflows also retain manual dispatch for
re-publishing an existing release. The Snap manual workflow supports both
`candidate` and `stable` channels.

The workflow also supports `workflow_dispatch` for test builds. Manual builds
are uploaded as a combined workflow artifact and are not published as releases.

## Publish the signed APT and RPM repositories

One combined Pages workflow deploys both repositories so two independent
workflows do not overwrite the same GitHub Pages site.

Repository setup (one time):

1. Enable GitHub Pages with **GitHub Actions** as its source.
2. Generate a dedicated GPG signing key outside CI.
3. Add the ASCII-armored private key as the Actions secret
   `APT_SIGNING_KEY`.
4. If protected, add its passphrase as `APT_SIGNING_KEY_PASSPHRASE`.
5. The `Publish signed Linux package repositories` workflow runs automatically
   after a successful tagged Linux release. It can also be run manually to
   republish an existing release tag.

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

The `Publish Snap Store package` workflow runs automatically after a successful
tagged Linux release and publishes both architectures to `stable`. It can also
be run manually with `candidate` for pre-release testing or `stable` to
republish.

## Required GitHub Actions secrets

| Secret                        | Used for                              |
| ----------------------------- | ------------------------------------- |
| `APT_SIGNING_KEY`             | Signs APT and RPM repository metadata |
| `APT_SIGNING_KEY_PASSPHRASE`  | Optional signing-key passphrase       |
| `SNAPCRAFT_STORE_CREDENTIALS` | Snap Store upload authentication      |

Never commit private signing keys or Snap Store credentials to the repository.
