---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Remove `version` property on `ServiceOptions` passed to `@service` decorator. That handling of that option was removed in `1.0.0-rc.0` where it was previously deprecated.
If wanting to specify version in an OpenAPI document use the `@OpenAPI.info` decorator from the `@typespec/openapi` library
