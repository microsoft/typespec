---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix bug in tspconfig.yaml
- Fix the issue that emitter option auto complete while inside "" will add extra ""`
