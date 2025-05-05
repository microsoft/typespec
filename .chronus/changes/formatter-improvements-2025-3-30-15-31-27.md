---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

`tsp format` only formats files it knows about and ignores other. Allowing a more generic glob pattern `tsp format .` or `tsp format "**/*"`
