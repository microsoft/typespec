---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Improvements to type relation errors: Show stack when it happens in a nested property otherwise show up in the correct location.
