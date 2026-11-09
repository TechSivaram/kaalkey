// Shared Linux display-backend detection for development and packaged launches.
// WSLg commonly exposes both variables, so prefer Wayland when available.

function getExplicitOzoneArgs(args = []) {
  const index = args.findIndex(
    (arg) => arg === "--ozone-platform" || arg.startsWith("--ozone-platform="),
  );

  if (index === -1) return [];

  if (args[index] === "--ozone-platform") {
    return args[index + 1] ? args.slice(index, index + 2) : [args[index]];
  }

  return [args[index]];
}

function getDetectedOzoneArgs({ platform = process.platform, env = process.env, args = [] } = {}) {
  if (platform !== "linux" || getExplicitOzoneArgs(args).length > 0) {
    return [];
  }

  if (env.WAYLAND_DISPLAY) {
    return ["--ozone-platform=wayland"];
  }

  if (env.DISPLAY) {
    return ["--ozone-platform=x11"];
  }

  return [];
}

function describeBackend(args) {
  const explicit = getExplicitOzoneArgs(args);
  const selected = explicit.length ? explicit : args;
  const option = selected.find((arg) => arg.startsWith("--ozone-platform="));

  if (option) return option.split("=", 2)[1];
  if (selected.includes("--ozone-platform")) return "explicit";
  return "default";
}

module.exports = {
  getDetectedOzoneArgs,
  getExplicitOzoneArgs,
  describeBackend,
};
