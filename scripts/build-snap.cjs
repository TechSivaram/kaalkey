const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const outputDir = path.resolve(projectRoot, packageJson.build?.directories?.output || "release");
const snapArch = process.arch === "arm64" ? "arm64" : process.arch === "x64" ? "amd64" : null;
if (!snapArch) {
  console.error(`[KaalKey] Unsupported Snap build architecture: ${process.arch}`);
  process.exit(1);
}
const snapProjectDir = path.join(outputDir, `__snap-${snapArch}`);
const snapcraftYaml = path.join(snapProjectDir, "snap", "snapcraft.yaml");

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
// snap/gui, but also adds an apps.<name>.desktop reference to meta/gui.
// Snapcraft expects that explicit desktop reference to exist in prime already,
// so it fails before it can perform its normal snap/gui -> meta/gui copy.
// Remove only that redundant reference; leave the generated launcher in
// snap/gui so Snapcraft can install it using its standard desktop integration.
function repairCore24DesktopReference() {
  if (!fs.existsSync(snapcraftYaml)) return false;

  const yaml = fs.readFileSync(snapcraftYaml, "utf8");
  const desktopReference = /^([\t ]*)desktop:[\t ]*meta\/gui\/[^\r\n]+(?:\r?\n|$)/gm;
  const matches = [...yaml.matchAll(desktopReference)];
  if (matches.length !== 1) return false;

  const desktopFile = path.join(
    snapProjectDir,
    "snap",
    "gui",
    path.basename(
      matches[0][0]
        .trim()
        .replace(/^desktop:[\t ]*/, "")
        .trim(),
    ),
  );
  if (!fs.existsSync(desktopFile)) {
    console.error(`[KaalKey] Expected generated desktop launcher was not found: ${desktopFile}`);
    return false;
  }

  const repaired = yaml.replace(desktopReference, "");
  fs.writeFileSync(snapcraftYaml, repaired);
  console.log(
    "[KaalKey] Repaired electron-builder Core24 desktop path; Snapcraft will use snap/gui.",
  );
  return true;
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

// Resolve the electron-builder CLI from this project's local dependencies.
// Do not rely on npm's node_modules/.bin PATH: direct `node scripts/...` calls
// do not add that directory automatically.
function resolveElectronBuilderCli() {
  const packagePath = path.join(projectRoot, "node_modules", "electron-builder", "package.json");
  if (!fs.existsSync(packagePath)) return null;

  const metadata = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const binEntry =
    typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.["electron-builder"];
  if (!binEntry) return null;

  const cliPath = path.resolve(path.dirname(packagePath), binEntry);
  return fs.existsSync(cliPath) ? cliPath : null;
}

const electronBuilderCli = resolveElectronBuilderCli();
if (!electronBuilderCli) {
  console.error(
    "[KaalKey] Could not find the local electron-builder CLI. Run `npm ci` from the project root and verify that devDependencies are installed.",
  );
  process.exit(1);
}
console.log(`[KaalKey] Using local electron-builder: ${electronBuilderCli}`);

const electronBuilderStatus = run(process.execPath, [
  electronBuilderCli,
  "--linux",
  "snap",
  ...process.argv.slice(2),
]);
if (electronBuilderStatus === 0) process.exit(0);

// Do not hide unrelated electron-builder/Snapcraft failures. Recover only
// when the known Core24 desktop-file mismatch is present in the generated tree.
if (!repairCore24DesktopReference()) process.exit(electronBuilderStatus);

let status = run("snapcraft", ["prime", "--destructive-mode"], snapProjectDir);
if (status !== 0) process.exit(status);

status = run("snapcraft", ["pack", "--destructive-mode"], snapProjectDir);
if (status !== 0) process.exit(status);

if (!publishBuiltSnapToOutput()) process.exit(1);
