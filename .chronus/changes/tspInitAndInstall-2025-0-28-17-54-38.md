---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Default behavior of `tsp init` changed to automatically run `tsp install`. This can be suppressed with `--skip-install`.
