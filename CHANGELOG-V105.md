# KaalKey V105

## Account-list normalization refactor

- Reused `normalizeAccountText` for account-list search matching and query normalization.
- Kept issuer/name matching case-insensitive and kept query trimming.
- Left sort selection and locale-aware sort behavior unchanged.
- Updated package and lockfile versions to `1.1.05`.
- No intended behavior change.
