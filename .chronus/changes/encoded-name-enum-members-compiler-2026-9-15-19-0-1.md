---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`@encodedName` on an enum member now sets the value the member is serialized as, including when it has an explicit value. Emitters can resolve it with `resolveEncodedEnumMemberValue`. A spec that relied on the encoded name being ignored can now report errors, such as an encoded name equal to another member's value, or a `@discriminated` union variant named after the member instead of its encoded name.

```tsp
enum ConversationStatus {
  // Keeps 0 for protobuf, serialized as "unknown" in JSON
  @encodedName("application/json", "unknown")
  CONVERSATION_STATUS_UNSPECIFIED: 0,
}
```
