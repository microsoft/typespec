---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http"
---

Fix OAuth2 scope deduplication in OpenAPI spec generation. OAuth2 authentication schemes with multiple flows sharing the same scopes no longer generate duplicate scope entries in the security section.