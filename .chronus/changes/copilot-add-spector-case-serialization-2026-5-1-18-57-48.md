---
changeKind: internal
packages:
  - "@typespec/http-specs"
---

Add encode/duration lossy Spector scenarios verifying a duration whose value carries more precision than the target integer encoding (fractional seconds and sub-millisecond milliseconds) is serialized as an integer