---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Model with an optional property should not be satisfy a constraint with that property required. (`{foo?: string}` cannot be assigned to a constraint of `{foo: string}`)
