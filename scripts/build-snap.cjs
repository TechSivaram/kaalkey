const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const outputDir = path.resolve(projectRoot, packageJson.build?.directories?.output || "release");
const snapArch = process.arch === "arm64" ? "arm64" : "amd64";
const snapProjectDir = path.join(outputDir, `__snap-${snapArch}`);
const snapcraftYaml = path.join(snapProjectDir, "snap", "snapcraft.yaml");
const primeGuiDir = path.join(snapProjectDir, "prime", "meta", "gui");

// Use the already-controlled Ubuntu/Docker build environment. This prevents
// Snapcraft from selecting LXD or Multipass for any subprocess.
process.env.SNAPCRAFT_BUILD_ENVIRONMENT = "host";
console.log("[KaalKey] Snapcraft build environment: host (destructive mode; no LXD)");

function run(command, args, cwd = projectRoot) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(`[KaalKey] Could not run ${command}:`, result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

// electron-builder 26's Core24 target writes its generated launcher to
// snap/gui, but may also add an apps.<name>.desktop reference to meta/gui.
// Snapcraft expects that explicit desktop reference to exist in prime already,
// so it can fail before completing the normal snap/gui -> meta/gui copy.
// Remove only that redundant reference; keep the actual launcher in snap/gui.
function repairCore24DesktopReference() {
  if (!fs.existsSync(snapcraftYaml)) return false;

  const yaml = fs.readFileSync(snapcraftYaml, "utf8");
  const desktopReference = /^([\t ]*)desktop:[\t ]*meta\/gui\/[^\r\n]+(?:\r?\n|$)/gm;
  const matches = [...yaml.matchAll(desktopReference)];
  if (matches.length !== 1) return false;

  const referencedPath = matches[0][0]
    .trim()
    .replace(/^desktop:[\t ]*/, "")
    .trim();
  const desktopFile = path.join(snapProjectDir, "snap", "gui", path.basename(referencedPath));

  if (!fs.existsSync(desktopFile)) {
    console.error(`[KaalKey] Expected generated desktop launcher was not found: ${desktopFile}`);
    return false;
  }

  fs.writeFileSync(snapcraftYaml, yaml.replace(desktopReference, ""));
  console.log(
    "[KaalKey] Repaired electron-builder Core24 desktop path; Snapcraft will use snap/gui.",
  );
  return true;
}

// Keep the application-specific desktop file and icon. The published 1.1.25
// Snap contained a second, generic launcher using icon.png. Removing that
// generic icon prevents Snap's generated fallback launcher from duplicating
// the explicit com.techsivaram.kaalkey.desktop entry. Also remove the generic
// desktop file if a Snapcraft/electron-builder version has already generated it.
function removeDuplicateSnapDesktopLauncher() {
  const canonicalDesktop = path.join(primeGuiDir, "com.techsivaram.kaalkey.desktop");
  const duplicateDesktop = path.join(primeGuiDir, "kaalkey-authenticator.desktop");
  const genericIcon = path.join(primeGuiDir, "icon.png");

  if (!fs.existsSync(canonicalDesktop)) {
    console.error(`[KaalKey] Expected application desktop file is missing: ${canonicalDesktop}`);
    return false;
  }

  if (fs.existsSync(duplicateDesktop)) {
    fs.unlinkSync(duplicateDesktop);
    console.log("[KaalKey] Removed duplicate Snap desktop launcher.");
  }

  if (fs.existsSync(genericIcon)) {
    fs.unlinkSync(genericIcon);
    console.log("[KaalKey] Removed generic Snap icon that creates a fallback launcher.");
  }

  // Verify the staged GUI directory contains exactly the intended desktop file.
  const desktopFiles = fs
    .readdirSync(primeGuiDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".desktop"))
    .map((entry) => entry.name);

  if (desktopFiles.length !== 1 || desktopFiles[0] !== "com.techsivaram.kaalkey.desktop") {
    console.error(
      `[KaalKey] Unexpected desktop files in prime/meta/gui: ${desktopFiles.join(", ") || "(none)"}`,
    );
    return false;
  }

  return true;
}

function removeExistingPackedSnaps() {
  for (const entry of fs.readdirSync(snapProjectDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".snap")) {
      fs.unlinkSync(path.join(snapProjectDir, entry.name));
    }
  }
}

function publishBuiltSnapToOutput() {
  const snapFiles = fs
    .readdirSync(snapProjectDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".snap"))
    .map((entry) => path.join(snapProjectDir, entry.name));

  if (snapFiles.length !== 1) {
    console.error(
      `[KaalKey] Expected one packed .snap file in ${snapProjectDir}; found ${snapFiles.length}.`,
    );
    return false;
  }

  const source = snapFiles[0];
  const destination = path.join(outputDir, path.basename(source));
  if (path.resolve(source) !== path.resolve(destination)) {
    fs.copyFileSync(source, destination);
  }
  console.log(`[KaalKey] Snap package ready: ${destination}`);
  return true;
}

// Resolve electron-builder from this project's installed dependencies. A script
// launched with `node scripts/build-snap.cjs` does not automatically inherit
// npm's node_modules/.bin PATH, so spawning the bare command can fail with ENOENT.
let electronBuilderCli;
try {
  electronBuilderCli = require.resolve("electron-builder/cli.js", {
    paths: [projectRoot],
  });
} catch (error) {
  console.error(
    "[KaalKey] electron-builder is not installed. Run `npm ci` from the project root before building the Snap.",
  );
  process.exit(1);
}

const electronBuilderStatus = run(process.execPath, [
  electronBuilderCli,
  "--linux",
  "snap",
  ...process.argv.slice(2),
]);

if (electronBuilderStatus !== 0) {
  // Recover only from the known Core24 desktop-file mismatch. Do not hide
  // unrelated electron-builder/Snapcraft failures.
  if (!repairCore24DesktopReference()) process.exit(electronBuilderStatus);

  const primeStatus = run("snapcraft", ["prime", "--destructive-mode"], snapProjectDir);
  if (primeStatus !== 0) process.exit(primeStatus);
} else if (!fs.existsSync(primeGuiDir)) {
  console.error(
    `[KaalKey] electron-builder succeeded but Snapcraft prime directory is missing: ${primeGuiDir}`,
  );
  process.exit(1);
}

// Apply the same launcher cleanup to both the normal electron-builder path and
// the Core24 recovery path. Repack from prime so the published .snap includes it.
if (!removeDuplicateSnapDesktopLauncher()) process.exit(1);

removeExistingPackedSnaps();

const packStatus = run("snapcraft", ["pack", "--destructive-mode"], snapProjectDir);
if (packStatus !== 0) process.exit(packStatus);

if (!publishBuiltSnapToOutput()) process.exit(1);
