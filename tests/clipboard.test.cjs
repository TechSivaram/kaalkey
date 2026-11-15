const test = require("node:test");
const assert = require("node:assert/strict");
const { registerClipboardHandlers } = require("../electron/clipboard.cjs");

function createHarness() {
  const handlers = new Map();
  const state = { text: "", image: null, formats: [] };
  const clipboard = {
    writeText(value) {
      state.text = value;
      state.formats = value ? ["text/plain"] : [];
    },
    readText() {
      return state.text;
    },
    clear() {
      state.text = "";
      state.image = null;
      state.formats = [];
    },
    availableFormats() {
      return state.formats;
    },
    writeImage(image) {
      state.image = image;
    },
    readImage() {
      return state.image || { isEmpty: () => true };
    },
    readBuffer(format) {
      return state.buffers?.[format] || Buffer.alloc(0);
    },
  };
  const nativeImage = {
    createFromDataURL(dataUrl) {
      return {
        dataUrl,
        isEmpty: () => !dataUrl.endsWith("VALID"),
        toDataURL: () => dataUrl,
      };
    },
    createFromBuffer(buffer) {
      const dataUrl = buffer.toString();
      return {
        isEmpty: () => !dataUrl.startsWith("data:image/"),
        toDataURL: () => dataUrl,
      };
    },
  };
  registerClipboardHandlers(
    { handle: (name, handler) => handlers.set(name, handler) },
    clipboard,
    nativeImage,
  );
  return { handlers, state };
}

test("writes text synchronously and reads it back", async () => {
  const { handlers, state } = createHarness();
  assert.equal(await handlers.get("desktop-clipboard:write-text")({}, "KaalKey test"), true);
  assert.equal(state.text, "KaalKey test");
  assert.equal(await handlers.get("desktop-clipboard:read-text")(), "KaalKey test");
});

test("rejects non-string text", async () => {
  const { handlers } = createHarness();
  assert.throws(() => handlers.get("desktop-clipboard:write-text")({}, 123), TypeError);
});

test("clears clipboard and reports text availability", async () => {
  const { handlers, state } = createHarness();
  await handlers.get("desktop-clipboard:write-text")({}, "secret");
  assert.equal(await handlers.get("desktop-clipboard:has-text")(), true);
  assert.equal(await handlers.get("desktop-clipboard:clear")(), true);
  assert.equal(state.text, "");
  assert.equal(await handlers.get("desktop-clipboard:has-text")(), false);
});

test("writes, reads and detects clipboard images", async () => {
  const { handlers } = createHarness();
  const dataUrl = "data:image/png;base64,VALID";
  assert.equal(await handlers.get("desktop-clipboard:write-image")({}, dataUrl), true);
  assert.equal(await handlers.get("desktop-clipboard:has-image")(), true);
  assert.deepEqual(await handlers.get("desktop-clipboard:read-image")(), { dataUrl });
});

test("rejects unsupported and invalid clipboard image data", async () => {
  const { handlers } = createHarness();
  assert.throws(
    () => handlers.get("desktop-clipboard:write-image")({}, "data:text/plain;base64,VALID"),
    TypeError,
  );
  assert.throws(
    () => handlers.get("desktop-clipboard:write-image")({}, "data:image/png;base64,BROKEN"),
    TypeError,
  );
});

test("falls back to an advertised encoded image clipboard format", async () => {
  const { handlers, state } = createHarness();
  state.formats = ["image/png"];
  state.buffers = { "image/png": Buffer.from("data:image/png;base64,VALID") };
  state.image = null;
  const result = await handlers.get("desktop-clipboard:read-image")();
  assert.deepEqual(result, { dataUrl: "data:image/png;base64,VALID" });
});
