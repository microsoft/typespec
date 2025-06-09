---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/openapi"
---

Fix `@tagMetadata` decorator emitting error when incorrectly not finding `@service` decorator
