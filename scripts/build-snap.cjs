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
const snapGuiDir = path.join(snapProjectDir, "snap", "gui");
const sourceStoreIcon = path.join(projectRoot, "snap", "gui", "icon.png");

console.log("[KaalKey] Snapcraft build environment: LXD (Core24 GNOME extension enabled)");

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
  if (!fs.existsSync(snapcraftYaml)) return "failed";

  const yaml = fs.readFileSync(snapcraftYaml, "utf8");
  const desktopReference = /^([\t ]*)desktop:[\t ]*meta\/gui\/[^\r\n]+(?:\r?\n|$)/gm;
  const matches = [...yaml.matchAll(desktopReference)];
  // No generated meta/gui reference means there is nothing to repair.
  if (matches.length === 0) return "not-needed";
  if (matches.length !== 1) return "failed";

  const referencedPath = matches[0][0]
    .trim()
    .replace(/^desktop:[\t ]*/, "")
    .trim();
  const desktopFile = path.join(snapProjectDir, "snap", "gui", path.basename(referencedPath));

  if (!fs.existsSync(desktopFile)) {
    console.error(`[KaalKey] Expected generated desktop launcher was not found: ${desktopFile}`);
    return "failed";
  }

  fs.writeFileSync(snapcraftYaml, yaml.replace(desktopReference, ""));
  console.log(
    "[KaalKey] Repaired electron-builder Core24 desktop path; Snapcraft will use snap/gui.",
  );
  return "repaired";
}

// Ensure the Snap metadata uses the dedicated 256px Store icon.
function configureSnapStoreIcon() {
  if (!fs.existsSync(sourceStoreIcon)) {
    console.error(`[KaalKey] Snap Store icon is missing: ${sourceStoreIcon}`);
    return false;
  }

  fs.mkdirSync(snapGuiDir, { recursive: true });
  fs.copyFileSync(sourceStoreIcon, path.join(snapGuiDir, "icon.png"));

  if (!fs.existsSync(snapcraftYaml)) return false;
  let yaml = fs.readFileSync(snapcraftYaml, "utf8");
  if (/^icon:\s*.*$/m.test(yaml)) {
    yaml = yaml.replace(/^icon:\s*.*$/m, "icon: snap/gui/icon.png");
  } else {
    yaml = yaml.replace(/^(version:[^\r\n]*\r?\n)/m, "$1icon: snap/gui/icon.png\n");
  }
  fs.writeFileSync(snapcraftYaml, yaml);
  console.log("[KaalKey] Configured the Snap Store icon.");
  return true;
}

// Core24's GNOME extension supplies the GTK icon themes and runtime required
// by GTK file choosers. Fail the build if destructive mode omitted it.
function verifyGnomeRuntime() {
  if (!fs.existsSync(snapcraftYaml)) return false;
  const yaml = fs.readFileSync(snapcraftYaml, "utf8");
  const required = ["gnome", "gtk-3-themes", "icon-themes", "gnome-46-2404"];
  const missing = required.filter((item) => !yaml.includes(item));
  if (missing.length) {
    console.error(`[KaalKey] Core24 GNOME runtime configuration is missing: ${missing.join(", ")}`);
    console.error("[KaalKey] Build Snap with LXD; do not use --destructive-mode.");
    return false;
  }
  return true;
}

// Keep the application-specific desktop file. The published 1.1.25 Snap
// contained a second, generic launcher; remove that duplicate while preserving
// meta/gui/icon.png, which is the Snap Store icon.
function removeDuplicateSnapDesktopLauncher() {
  const canonicalDesktop = path.join(primeGuiDir, "com.techsivaram.kaalkey.desktop");
  const duplicateDesktop = path.join(primeGuiDir, "kaalkey-authenticator.desktop");

  if (!fs.existsSync(canonicalDesktop)) {
    console.error(`[KaalKey] Expected application desktop file is missing: ${canonicalDesktop}`);
    return false;
  }

  if (fs.existsSync(duplicateDesktop)) {
    fs.unlinkSync(duplicateDesktop);
    console.log("[KaalKey] Removed duplicate Snap desktop launcher.");
  }

  // Keep meta/gui/icon.png: Snapcraft uses it as the Store icon. The duplicate
  // launcher is the generic .desktop file, not the icon metadata itself.

  // Verify the staged GUI directory contains exactly the intended desktop file.
  const desktopFiles = fs
    .readdirSync(primeGuiDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".desktop"))
    .map((entry) => entry.name);

  const storeIcon = path.join(primeGuiDir, "icon.png");
  if (!fs.existsSync(storeIcon) || fs.statSync(storeIcon).size === 0) {
    console.error(`[KaalKey] Snap Store icon is missing from prime: ${storeIcon}`);
    return false;
  }

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
  const repairResult = repairCore24DesktopReference();
  if (repairResult !== "repaired") process.exit(electronBuilderStatus);
} else if (!fs.existsSync(snapcraftYaml)) {
  console.error(
    `[KaalKey] electron-builder completed but did not generate the Snapcraft project: ${snapcraftYaml}`,
  );
  process.exit(1);
} else {
  // A successful electron-builder run does not guarantee that Snapcraft has
  // created prime/. That directory is produced by the explicit prime step below.
  const repairResult = repairCore24DesktopReference();
  if (repairResult === "failed") {
    console.error("[KaalKey] Could not validate the generated Core24 desktop launcher reference.");
    process.exit(1);
  }
}

// Configure metadata first, then let Snapcraft create prime/ from the project.
if (!configureSnapStoreIcon()) process.exit(1);
if (!verifyGnomeRuntime()) process.exit(1);
const primeStatus = run("snapcraft", ["prime", "--use-lxd"], snapProjectDir);
if (primeStatus !== 0) process.exit(primeStatus);

// Remove only the known duplicate generic launcher, then repack from prime.
if (!removeDuplicateSnapDesktopLauncher()) process.exit(1);

removeExistingPackedSnaps();

const packStatus = run("snapcraft", ["pack"], snapProjectDir);
if (packStatus !== 0) process.exit(packStatus);

if (!publishBuiltSnapToOutput()) process.exit(1);
