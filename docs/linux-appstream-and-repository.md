# Linux AppStream metadata and package trust

KaalKey declares the MIT license in `package.json` and includes the corresponding
license text in `LICENSE`.

For Debian packages, `scripts/fix-linux-packages.cjs` runs after electron-builder
and inserts `com.techsivaram.kaalkey.metainfo.xml` directly into the DEB payload at
`/usr/share/metainfo/`. This makes the metadata a package-owned file, rather than
a file copied by a post-install script. Verify after installation with:

```sh
dpkg -S /usr/share/metainfo/com.techsivaram.kaalkey.metainfo.xml
```

The metadata describes KaalKey and declares `project_license` as `MIT`.
`metadata_license` is `CC0-1.0` because the AppStream metadata document itself
is dedicated under CC0; this is distinct from the application's MIT license.

The Ubuntu App Center warning "Potentially Unsafe / Provided by a third party"
is a publisher/source provenance warning. AppStream metadata and an MIT license
do not remove it. Addressing it requires distribution through a signed APT
repository, with signed Release metadata and a repository key distributed via
a trusted channel.

The post-build DEB step requires `dpkg-deb` on the build machine. It deliberately
does not claim to modify RPM packages; RPM payload integration needs its own
packaging step and validation.

## Debian copyright file

The DEB post-build integration also writes the complete MIT license to
`/usr/share/doc/kaalkeyauthenticator/copyright`. This is the conventional
Debian package copyright/license location and is package-owned. Verify after
installation with:

```sh
dpkg -S /usr/share/doc/kaalkeyauthenticator/copyright
```
