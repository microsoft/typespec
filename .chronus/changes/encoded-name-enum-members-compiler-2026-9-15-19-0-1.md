---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

`@encodedName` now sets the value an enum member is serialized as, including for members with an explicit value. Example, default and discriminator values use the `application/json` encoded name, and `resolveEncodedEnumMemberValue` resolves it for emitters. A spec that relied on the encoded name being ignored may now report errors, for example a `@discriminated` union variant named after the member instead of its encoded name.

```tsp
enum ConversationStatus {
  // Keeps 0 for protobuf, serialized as "unknown" in JSON
  @encodedName("application/json", "unknown")
  CONVERSATION_STATUS_UNSPECIFIED: 0,
}
```
