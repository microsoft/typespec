# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `ignoreOrder` option to `expectDiagnostics` testing helper to enable order-independent diagnostic comparison