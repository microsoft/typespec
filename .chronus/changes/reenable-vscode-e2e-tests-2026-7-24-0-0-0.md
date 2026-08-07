---
changeKind: internal
packages:
  - typespec-vscode
---

Re-enable the VS Code e2e tests (`test:web` and `test:extension`) that were temporarily skipped due to a hang in CI with the VS Code 1.130.0 release. The regression was fixed in VS Code 1.131.0, so the version pin has been removed and tests now run against the latest stable VS Code release.
