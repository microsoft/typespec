---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add Spector scenarios for ordinary constrained unions containing a string literal and a derived scalar. Cover literal and custom string values without adding discriminators or envelopes or requiring an enum SDK representation.

```tsp
scalar CollectionId extends string;
union CollectionSelector extends string {
  all: "all",
  collection: CollectionId,
}
```
