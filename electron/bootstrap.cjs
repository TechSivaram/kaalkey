// Packaged-app entry point. Re-launch the Electron executable with the selected
// Ozone switch so Chromium receives it at process startup, before initialization.
const { app } = require("electron");
const { spawn } = require("node:child_process");
const { getDetectedOzoneArgs, getExplicitOzoneArgs } = require("./display-backend.cjs");

const originalArgs = process.argv.slice(1);
const explicitOzoneArgs = getExplicitOzoneArgs(originalArgs);
const ozoneArgs = explicitOzoneArgs.length ? [] : getDetectedOzoneArgs({ args: originalArgs });

if (ozoneArgs.length === 0) {
  // An explicit backend was supplied, no graphical session was detected, or
  // this is not Linux. Continue with the normal application entry point.
  require("./main.cjs");
} else {
  console.log(`[KaalKey] Re-launching packaged app with ${ozoneArgs.join(" ")}`);

  const child = spawn(process.execPath, [...ozoneArgs, ...originalArgs], {
    env: process.env,
    stdio: "inherit",
  });

  child.once("error", (error) => {
    console.error("[KaalKey] Could not re-launch with display backend:", error);
    app.exit(1);
  });

  child.once("exit", (code, signal) => {
    if (signal) {
      console.error(`[KaalKey] Re-launched application exited due to signal ${signal}`);
      app.exit(1);
    } else {
      app.exit(code ?? 0);
    }
  });

  child.unref();
  app.quit();
}
