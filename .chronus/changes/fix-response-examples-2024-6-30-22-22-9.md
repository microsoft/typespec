---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/http"
---

API: Expose `properties: HttpProperty[]` on operation parameter and response which reference all the properties of interest(Body, statusCode, contentType, implicitBodyProperty, etc.)
