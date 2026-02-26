---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Import tool: Support importing `readOnly` and `writeOnly` properties from OpenAPI. 
- `readOnly: true` is converted to `@visibility(Lifecycle.Read)`
- `writeOnly: true` is converted to `@visibility(Lifecycle.Create)`
- Both properties are mutually exclusive, a warning is emitted if both are present and both are ignored
