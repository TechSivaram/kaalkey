// Development launcher: choose the display backend before Chromium starts.
const { spawn } = require("node:child_process");
const path = require("node:path");
const electronExecutable = require("electron");
const { getDetectedOzoneArgs, getExplicitOzoneArgs } = require("./display-backend.cjs");

const forwardedArgs = process.argv.slice(2);
const explicitOzoneArgs = getExplicitOzoneArgs(forwardedArgs);
const ozoneArgs = explicitOzoneArgs.length
  ? explicitOzoneArgs
  : getDetectedOzoneArgs({ args: forwardedArgs });
const appArgs = forwardedArgs.filter((arg, index) => {
  if (arg === "--ozone-platform") return false;
  if (index > 0 && forwardedArgs[index - 1] === "--ozone-platform") return false;
  return !arg.startsWith("--ozone-platform=");
});

if (ozoneArgs.length) {
  console.log(`[KaalKey] Starting Electron with ${ozoneArgs.join(" ")}`);
} else {
  console.log("[KaalKey] No display backend override; using Electron defaults");
}

const child = spawn(
  electronExecutable,
  [...ozoneArgs, path.join(__dirname, "main.cjs"), ...appArgs],
  { stdio: "inherit", env: process.env },
);

child.on("error", (error) => {
  console.error("[KaalKey] Failed to start Electron:", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[KaalKey] Electron exited due to signal ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 0;
  }
});
