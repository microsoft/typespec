---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix package-manager downloads from authenticated registry mirrors by supporting the `TYPESPEC_NPM_REGISTRY_TOKEN` environment variable for TypeSpec's package metadata and tarball requests.
