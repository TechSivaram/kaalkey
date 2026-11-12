#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const sourceMeta = path.join(
  root,
  "build",
  "linux",
  "metainfo",
  "com.techsivaram.kaalkey.metainfo.xml",
);
const componentId = "com.techsivaram.kaalkey";
const targetRelative = path.join("usr", "share", "metainfo", `${componentId}.metainfo.xml`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

if (!fs.existsSync(sourceMeta)) {
  throw new Error(`AppStream metadata not found: ${sourceMeta}`);
}
const metadataText = fs.readFileSync(sourceMeta, "utf8");
if (
  !metadataText.includes("<id>com.techsivaram.kaalkey</id>") ||
  !metadataText.includes("<pkgname>kaalkeyauthenticator</pkgname>") ||
  !metadataText.includes("<project_license>MIT</project_license>")
) {
  throw new Error(
    "AppStream metadata must declare the KaalKey component ID, Debian package name, and MIT project license.",
  );
}

if (!fs.existsSync(releaseDir)) {
  throw new Error(`Release directory not found: ${releaseDir}`);
}

const debs = fs
  .readdirSync(releaseDir)
  .filter((name) => name.endsWith(".deb"))
  .map((name) => path.join(releaseDir, name));

if (debs.length === 0) {
  console.warn("No DEB packages found; skipping DEB AppStream payload integration.");
  process.exit(0);
}

for (const deb of debs) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "kaalkey-deb-"));
  try {
    run("dpkg-deb", ["-R", deb, temp]);
    const destination = path.join(temp, targetRelative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(sourceMeta, destination);
    fs.chmodSync(destination, 0o644);

    // Debian Policy expects a copyright file under /usr/share/doc/<package>/.
    const packageName = "kaalkeyauthenticator";
    const copyrightDir = path.join(temp, "usr", "share", "doc", packageName);
    fs.mkdirSync(copyrightDir, { recursive: true });
    const copyrightText = `MIT License

Copyright (c) 2026 TechSivaram

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    fs.writeFileSync(path.join(copyrightDir, "copyright"), copyrightText, { mode: 0o644 });

    const rebuilt = `${deb}.new`;
    run("dpkg-deb", ["--build", "--root-owner-group", temp, rebuilt]);
    fs.renameSync(rebuilt, deb);
    console.log(`Embedded AppStream metadata in ${path.basename(deb)}`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

console.log("DEB AppStream payload integration complete.");
