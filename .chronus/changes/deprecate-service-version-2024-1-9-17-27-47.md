---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate `@service` version property. If wanting to describe a service versioning you can use the `@typespec/versioning` library. If wanting to describe the project version you can use the package.json version. For OpenAPI generation. the `@OpenAPI.info` nows decorator allows providing the document version.
