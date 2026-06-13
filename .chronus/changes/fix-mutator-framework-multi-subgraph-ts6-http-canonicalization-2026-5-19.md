---
changeKind: feature
packages:
  - "@typespec/http-canonicalization"
---

Add `alternateType` option to `HttpCanonicalizationOptions` and override `buildTypeEdges()` in `ModelPropertyHttpCanonicalization` to support routing the language edge to an alternate type while keeping the wire edge on the original type. This enables `@alternateType` scenarios where the language representation and wire encoding diverge.
