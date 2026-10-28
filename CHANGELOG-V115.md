# V115 — CountdownRing dynamic style fix

- Fixed `CountdownRing` initialization order: animated `pulse` is now created before the style that references it.
- Moved countdown number color computation before dynamic style creation.
- Replaced generated inline style objects with locally computed styles after their values are initialized.
- Preserved countdown animation and segment rendering behavior.
- Updated package and Expo app versions to `1.1.15`.
