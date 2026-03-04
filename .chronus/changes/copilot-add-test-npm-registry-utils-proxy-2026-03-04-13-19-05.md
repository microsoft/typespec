---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Add e2e test to verify `fetchPackageManifest` from `npm-registry-utils` works through an HTTP proxy using Node.js 24's `--use-env-proxy` flag.
