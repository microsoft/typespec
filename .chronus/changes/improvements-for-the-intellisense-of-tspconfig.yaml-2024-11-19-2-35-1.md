---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Improvements for the intellisense of tspconfig.yaml
- Support the auto completion for extends, imports, rule, rule sets and variables in tspconfig.yaml
- Show required/optional information in the details of emitter's options completion item in tspconfig.yaml
