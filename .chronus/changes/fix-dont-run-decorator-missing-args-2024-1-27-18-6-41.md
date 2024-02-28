---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Decorators that have missing arguments will not run. This is inline with passing invalid argument to a decorator that would prevent it from running.
