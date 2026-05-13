---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Propagate `@JsonSchema.uniqueItems` to query, path and header parameter schemas. The decorator was only applied to body model property schemas; for HTTP parameter schemas (which go through `applyIntrinsicDecorators`) it was silently dropped, so arrays declared on operation parameters never emitted `uniqueItems: true` even when the decorator was present.

```tsp
op listUsers(
  @query
  @JsonSchema.uniqueItems
  $select?: ("id" | "displayName")[],
): User[];
```
