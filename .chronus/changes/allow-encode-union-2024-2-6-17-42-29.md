---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Enable the use of `@encode` for model properties that have a union type. This supports cases like `@encode("rfc3339") prop: utcDateTime | null`
