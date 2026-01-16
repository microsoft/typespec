---
changeKind: deprecation
packages:
  - "@typespec/compiler"
  - "@typespec/http"
  - "@typespec/openapi3"
  - "@typespec/tspd"
  - "@typespec/http-server-js"
  - "@typespec/http-server-csharp"
---

Deprecate `program` parameter in `isArrayModelType` and `isRecordModelType` functions. Use the new single-argument overload instead: `isArrayModelType(type)` and `isRecordModelType(type)`.
