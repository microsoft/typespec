---
changeKind: feature
packages:
  - "@typespec/json-schema"
---

Emit unconstrained union variants as a compact JSON Schema `type` array instead of separate `anyOf` branches, preserving constrained variants and explicit `@oneOf` behavior.

For example, `value: string | null` now emits:

```json
{ "type": ["string", "null"] }
```
