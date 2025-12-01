---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

[API] Introducution of decorator validator callbacks. A decorator can define some callbacks to achieve some defered validation(After the type is finished or the whole graph is)
