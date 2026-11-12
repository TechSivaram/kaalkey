# Linux application metadata

KaalKey's Linux packages declare the MIT license in `package.json` and ship
AppStream metadata for `com.techsivaram.kaalkey`.

The DEB and RPM targets install the AppStream component at
`/usr/share/metainfo/com.techsivaram.kaalkey.metainfo.xml` using their package
post-install hooks. Their post-remove hooks remove that generated metadata.
The source-of-truth metadata is
`metainfo/com.techsivaram.kaalkey.metainfo.xml`; keep the embedded copy in
`scripts/appstream-after-install.sh` synchronized when editing the component.

The AppStream component uses `CC0-1.0` for the metadata itself and `MIT` for
the application project. The root `LICENSE` file contains the application's
MIT license text.

AppStream metadata and license declarations improve software-center metadata,
but do not establish publisher authenticity. A "third-party" or trust warning
may remain for packages downloaded outside a configured repository. Trusted
repository distribution requires a signed APT/YUM repository and appropriate
publisher/distribution configuration.
