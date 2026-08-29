---
changeKind: internal
packages:
  - "@typespec/http-client-csharp"
---

Move C# member name normalization (acronym casing, date-time naming conventions and the `Url` to `Uri` suffix) from the generator into the emitter. Normalized input types now carry an `originalName` holding the spec name, which the generator uses to restore previously shipped names for back compatibility.
