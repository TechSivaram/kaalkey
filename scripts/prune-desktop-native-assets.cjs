#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const nodeModules = path.resolve(process.cwd(), "node_modules");
if (!fs.existsSync(nodeModules)) {
  console.error(`[desktop-prune] node_modules not found: ${nodeModules}`);
  process.exit(1);
}

let removed = 0;
function walk(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.name === "spm-deps") {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removed += 1;
      console.log(
        `[desktop-prune] Removed unused native asset directory: ${path.relative(process.cwd(), fullPath)}`,
      );
      continue;
    }
    walk(fullPath);
  }
}

walk(nodeModules);
console.log(
  `[desktop-prune] Complete. Removed ${removed} spm-deps director${removed === 1 ? "y" : "ies"}.`,
);
