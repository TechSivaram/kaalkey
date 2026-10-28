# KaalKey V106

## V105 account-list import syntax repair

- Fixed `src/utils/accountList.ts`: replaced the literal `\\n` between import declarations with an actual line break.
- This addresses the Babel/Metro `Expecting Unicode escape sequence \\uXXXX` parse error reported in V105.
- Retained V105 account-list normalization and search behavior.
- Updated package and lockfile versions to `1.1.06`.
