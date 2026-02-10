---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate `program` parameter in `isArrayModelType` and `isRecordModelType` functions. Use the new single-argument overload instead: `isArrayModelType(type)` and `isRecordModelType(type)`.
