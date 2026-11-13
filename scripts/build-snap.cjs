const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const outputDir = path.resolve(projectRoot, packageJson.build?.directories?.output || "release");

function fail(message, code = 1) {
  console.error(`[KaalKey] ${message}`);
  process.exit(code);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
    ...options,
  });

  if (result.error) {
    fail(`Could not run ${command}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} exited with status ${result.status ?? 1}.`, result.status ?? 1);
  }
  return result;
}

// electron-builder's Core24 generator adds a `desktop:` property to the
// Snapcraft app declaration. Snapcraft then creates an app-name-based desktop
// alias in addition to the Electron appId desktop file. KaalKey keeps the
// Electron-generated snap/gui/<appId>.desktop and removes that extra property.
function disableDuplicateCore24DesktopAlias() {
  let core24Path;
  try {
    core24Path = require.resolve("app-builder-lib/out/targets/snap/core24.js", {
      paths: [projectRoot],
    });
  } catch {
    fail(
      "Could not locate app-builder-lib's Core24 Snap target. Run npm ci/npm install and verify electron-builder is installed.",
    );
  }

  const source = fs.readFileSync(core24Path, "utf8");
  const desktopPropertyPattern =
    /^[ \t]*desktop:[ \t]*`(?:meta\/)?gui\/\$\{desktopBaseName\}\.desktop`,?[ \t]*\r?\n/gm;
  const matches = [...source.matchAll(desktopPropertyPattern)];

  if (matches.length > 1) {
    fail(
      `Found ${matches.length} Core24 desktop declarations in ${core24Path}; refusing to patch an unexpected builder implementation.`,
    );
  }

  if (matches.length === 1) {
    const patched = source.replace(desktopPropertyPattern, "");
    fs.writeFileSync(core24Path, patched, "utf8");
    console.log(
      "[KaalKey] Disabled Snapcraft's duplicate desktop alias; retaining the Electron-generated launcher.",
    );
    return;
  }

  // Idempotent: the previous KaalKey patch removed this property already.
  // Accept that known state, but fail if a future builder uses an unrecognized
  // desktop property involving desktopBaseName.
  if (
    source.includes("desktopBaseName") &&
    !/^[ \t]*desktop:[^\r\n]*desktopBaseName/m.test(source)
  ) {
    console.log("[KaalKey] Duplicate Core24 desktop alias is already disabled.");
    return;
  }

  fail(
    `Could not identify the expected Core24 desktop declaration in ${core24Path}. Refusing to build a Snap that may contain duplicate launchers.`,
  );
}

function cleanPreviousSnapBuilds() {
  fs.mkdirSync(outputDir, { recursive: true });

  // electron-builder/Snapcraft can reuse these architecture-specific staging
  // directories. Clear both so a previous local or cross-architecture build
  // cannot leak files into the next package.
  for (const name of fs.readdirSync(outputDir)) {
    if (name.startsWith("__snap-")) {
      fs.rmSync(path.join(outputDir, name), { recursive: true, force: true });
      console.log(`[KaalKey] Removed stale Snap staging directory: ${name}`);
    }
  }

  // The script creates one Snap per invocation. Remove old root-level Snap
  // artifacts so discovery and CI cannot mistake an earlier package for this
  // build's output. Other release formats are left untouched.
  for (const name of fs.readdirSync(outputDir)) {
    if (name.endsWith(".snap")) {
      fs.rmSync(path.join(outputDir, name), { force: true });
      console.log(`[KaalKey] Removed previous Snap artifact: ${name}`);
    }
  }
}

function findSnapFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...findSnapFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".snap")) {
      found.push(fullPath);
    }
  }
  return found;
}

function verifySingleDesktopLauncher(snapPath) {
  const result = spawnSync("unsquashfs", ["-ll", snapPath], {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error) {
    fail(
      `Could not run unsquashfs: ${result.error.message}. Install squashfs-tools before building/verifying the Snap.`,
    );
  }
  if (result.status !== 0) {
    fail(`Could not inspect generated Snap ${snapPath}: ${result.stderr || result.status}`);
  }

  const desktopFiles = (result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/).pop())
    .filter((entry) => /(?:^|\/)meta\/gui\/[^/]+\.desktop$/.test(entry));

  const appId = packageJson.build?.appId;
  const expectedDesktop = appId ? `${appId}.desktop` : null;

  if (desktopFiles.length !== 1) {
    fail(
      `Expected exactly one desktop launcher in the Snap, found ${desktopFiles.length}:\n${desktopFiles.map((file) => `  ${file}`).join("\n") || "  (none)"}`,
    );
  }

  const actualDesktop = path.posix.basename(desktopFiles[0]);
  if (expectedDesktop && actualDesktop !== expectedDesktop) {
    fail(
      `Expected the Electron launcher ${expectedDesktop}, but found ${actualDesktop}. Check the Snap desktop integration.`,
    );
  }

  console.log(`[KaalKey] Verified one desktop launcher: ${actualDesktop}`);
}

if (!packageJson.build?.snapcraft) {
  fail(
    "package.json is missing build.snapcraft. Configure the Snap base and Core24 options before building.",
  );
}

if (packageJson.build.snapcraft.base !== "core24") {
  fail(
    `Expected Snap base core24, but package.json specifies ${packageJson.build.snapcraft.base}.`,
  );
}

const electronBuilderCli = (() => {
  try {
    return require.resolve("electron-builder/cli.js", { paths: [projectRoot] });
  } catch {
    fail("electron-builder is not installed. Run npm ci from the project root.");
  }
})();

disableDuplicateCore24DesktopAlias();
cleanPreviousSnapBuilds();

const buildStartedAt = Date.now();

console.log("[KaalKey] Building the Core24 Snap with electron-builder.");
console.log(
  "[KaalKey] Snapcraft handles priming and packing internally; this script will not run snapcraft prime/pack a second time.",
);

// Force Snapcraft 9 to use the already initialized LXD provider. This is
// inherited by electron-builder and the Snapcraft process it launches.
const snapcraftEnv = {
  ...process.env,
  SNAPCRAFT_BUILD_ENVIRONMENT: "lxd",
};

console.log("[KaalKey] SNAPCRAFT_BUILD_ENVIRONMENT=lxd");
run(process.execPath, [electronBuilderCli, "--linux", "snap", ...process.argv.slice(2)], {
  env: snapcraftEnv,
});

const candidates = findSnapFiles(outputDir).filter((file) => {
  try {
    return fs.statSync(file).mtimeMs >= buildStartedAt - 2000;
  } catch {
    return false;
  }
});

if (candidates.length === 0) {
  fail(
    `electron-builder completed, but no newly generated .snap file was found under ${outputDir}. Check the electron-builder output above.`,
  );
}

const rootCandidates = candidates.filter((file) => path.dirname(file) === outputDir);
const finalCandidates = rootCandidates.length > 0 ? rootCandidates : candidates;

if (finalCandidates.length !== 1) {
  fail(
    `Expected exactly one newly generated Snap, found ${finalCandidates.length}:\n${finalCandidates.map((file) => `  ${file}`).join("\n")}`,
  );
}

const snapPath = finalCandidates[0];
const snapStat = fs.statSync(snapPath);

if (!snapStat.isFile() || snapStat.size === 0) {
  fail(`The generated Snap is empty or invalid: ${snapPath}`);
}

verifySingleDesktopLauncher(snapPath);

console.log(`[KaalKey] Snap package ready: ${snapPath}`);
console.log(`[KaalKey] Size: ${(snapStat.size / (1024 * 1024)).toFixed(1)} MB`);
