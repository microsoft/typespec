---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Enum members use their `application/json` `@encodedName` as their serialized value, including members with an explicit value, written as an escaped C# string literal. Every property gets one `JsonPropertyName`, carrying its `application/json` encoded name when it has one, escaped the same way, as the emitter-framework C# `Property` does. A property with an `@encodedName` used to get two, which C# refuses (CS0579); a property of an anonymous request body ignored its `@encodedName`; and a property whose json name matched its C# name, such as `@encodedName("application/json", "FullName") fullName` or `Title`, got none, so the generated serializer's camelCase naming policy wrote `fullName` or `title`. A non-integer enum whose members are all encoded is typed as the enum instead of `double`.
