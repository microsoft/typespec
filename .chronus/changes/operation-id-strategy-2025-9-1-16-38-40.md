---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add a new `operation-id-strategy` option.

- `parent-container` (default and previous behavior) Join operation name with its parent if applicable with an underscore
- `fqn` Join the path from the service root to the operation with `.`
- `none` Do not generate operation ids, only include explicit ones set with `@operationId`
