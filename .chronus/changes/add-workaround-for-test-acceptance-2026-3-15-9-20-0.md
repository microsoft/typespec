---
changeKind: fix
packages:
  - "@typespec/http-specs"
---

Accept `2022-08-26T18:38:00.0000000Z` (7 fractional digit ticks, as emitted by .NET clients) as a valid RFC3339 UTC datetime form in the `ModelWithDatetime` XML scenario.
