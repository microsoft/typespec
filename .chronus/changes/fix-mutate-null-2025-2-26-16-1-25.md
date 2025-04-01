---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix crash that would happen when a type was mutated while using null in a decorator(e.g. when using versioning library with `@example(null)`)
