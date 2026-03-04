---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

`tsp info` now accepts an optional `<libName>` argument to display detailed information about a specific library or emitter, including all available options.
