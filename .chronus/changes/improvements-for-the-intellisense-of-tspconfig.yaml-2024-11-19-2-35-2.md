---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Improvements for the intellisense of tspconfig.yaml
- Supports auto-completion of the extends and imports paths
- The rule or ruleSets of the linter can be auto-completed
- Emitter optoins autocomplete intelligently handles quotation mark display
- Autocomplete of variable interpolation
- The parameters of emitter's options distinguish whether they are required or optional
