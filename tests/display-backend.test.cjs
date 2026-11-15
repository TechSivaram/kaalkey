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

test("recognizes WSLg through WSL_INTEROP when WSL_DISTRO_NAME is absent", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "linux",
      env: {
        WAYLAND_DISPLAY: "wayland-0",
        DISPLAY: ":0",
        WSL_INTEROP: "/run/WSL/123_interop",
      },
    }),
    ["--ozone-platform=wayland"],
  );
});

test("uses X11 when only DISPLAY is available", () => {
  assert.deepEqual(getDetectedOzoneArgs({ platform: "linux", env: { DISPLAY: ":0" } }), [
    "--ozone-platform=x11",
  ]);
});

test("leaves Chromium backend selection unchanged without a display", () => {
  assert.deepEqual(getDetectedOzoneArgs({ platform: "linux", env: {} }), []);
});

test("does not apply Linux Ozone switches on other platforms", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "darwin",
      env: { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" },
    }),
    [],
  );
});

test("preserves the two-argument explicit Ozone option", () => {
  assert.deepEqual(
    getDetectedOzoneArgs({
      platform: "linux",
      env: { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" },
      args: ["--ozone-platform", "wayland"],
    }),
    [],
  );
});
