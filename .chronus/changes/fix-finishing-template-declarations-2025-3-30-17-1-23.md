---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix decorators on model properties getting wrongly called when checking the template declaration in the following cases
 - inside a union expression
 - under an non templated operation under a templated interface
