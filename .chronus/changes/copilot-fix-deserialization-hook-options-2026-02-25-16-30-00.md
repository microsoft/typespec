---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix generated deserialization code to pass `ModelReaderWriterOptions` to custom hook methods that declare an `options` parameter
