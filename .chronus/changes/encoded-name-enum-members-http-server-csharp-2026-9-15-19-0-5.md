---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Enum members use their `application/json` `@encodedName` as their serialized value, including members with an explicit value, written as an escaped C# string literal. A property gets one `JsonPropertyName`, carrying its `application/json` encoded name when it has one, escaped the same way. A property with an `@encodedName` used to get two, which C# refuses (CS0579), and a property of an anonymous request body ignored its `@encodedName`. A non-integer enum whose members are all encoded is typed as the enum instead of `double`.
