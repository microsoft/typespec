---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Use `Utf8JsonReader` for untyped `CollectionResult` to efficiently read the continuation token or next link from the response body without fully deserializing the envelope model type. Nested property paths are supported.
