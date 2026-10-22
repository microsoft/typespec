---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Write exactly one `JsonPropertyName` per property, with its JSON name. Fixes a duplicate attribute (CS0579) on a camelCase property with an `@encodedName`, and a property such as `Title` being written as `title`.
