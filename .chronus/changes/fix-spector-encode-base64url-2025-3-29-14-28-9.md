---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http-specs"
---

Fixed the `@encode` value for `/encode/bytes/body/response/base64url` to explicitly specify `base64url`.
