const assert = require("node:assert/strict");
const { test } = require("node:test");
const { getDetectedOzoneArgs } = require("../electron/display-backend.cjs");

test("uses XWayland when a Linux Wayland session also provides X11", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "linux",
      env: { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" },
    }),
    ["--ozone-platform=x11"],
  );
});

test("keeps Wayland for WSLg when both display variables are present", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "linux",
      env: {
        WAYLAND_DISPLAY: "wayland-0",
        DISPLAY: ":0",
        WSL_DISTRO_NAME: "Ubuntu",
      },
    }),
    ["--ozone-platform=wayland"],
  );
});

test("uses Wayland when XWayland is unavailable", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "linux",
      env: { WAYLAND_DISPLAY: "wayland-0" },
    }),
    ["--ozone-platform=wayland"],
  );
});

test("does not override an explicit Ozone backend", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "linux",
      env: { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" },
      args: ["--ozone-platform=wayland"],
    }),
    [],
  );
});
