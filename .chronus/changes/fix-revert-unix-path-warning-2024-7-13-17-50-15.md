---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix: Revert `unix-style` warning that was preventing windows path via the CLI as well
