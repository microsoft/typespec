---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix bug in tspconfig.yaml
- Fix the issue that extra " will be added when auto completing emitter options inside ""
