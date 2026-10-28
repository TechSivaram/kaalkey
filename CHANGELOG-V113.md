# V113 — Restore stable styles baseline

- Reverted the faulty V112 automated inline-style extraction to the V111 source baseline.
- Keeps the prior stable app behavior and avoids malformed component declarations and duplicate `styles` declarations introduced by V112.
- Version bumped to 1.1.13.

Note: this release intentionally does not include the V112 style extraction; that refactor needs a safer syntax-aware pass.
