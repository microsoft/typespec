---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http"
---

Fix `HttpPart` not respecting explicit part name by always using the property name
