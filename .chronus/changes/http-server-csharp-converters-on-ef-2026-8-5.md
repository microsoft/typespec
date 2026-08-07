---
changeKind: internal
packages:
  - "@typespec/http-server-csharp"
---

Generate the JSON converter helpers with the emitter framework's `JsonConverter` component

`TimeSpanDurationConverter`, `Base64UrlJsonConverter` and the Unix epoch converters were raw string templates. The generated classes are unchanged apart from an explicit `using System;` that was previously implicit.
