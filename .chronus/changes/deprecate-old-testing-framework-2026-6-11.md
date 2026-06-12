---
changeKind: deprecation
packages:
  - "@typespec/compiler"
  - "@typespec/http"
  - "@typespec/rest"
  - "@typespec/versioning"
  - "@typespec/json-schema"
  - "@typespec/xml"
  - "@typespec/events"
  - "@typespec/sse"
  - "@typespec/streams"
  - "@typespec/html-program-viewer"
  - "@typespec/library-linter"
---

Deprecate old testing framework (`createTestHost`, `createTestRunner`, `createTestWrapper`, `createTestLibrary`, `BasicTestRunner`, `TypeSpecTestLibrary`, etc.). Use `createTester` from `@typespec/compiler/testing` instead.
