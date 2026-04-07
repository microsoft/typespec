---
changeKind: fix
packages:
  - "@typespec/spector"
---

Fix query parameter matcher handling: use `resolveMatchers: false` so matcher objects (e.g. `match.dateTime`) are checked semantically instead of being serialized to plain strings before comparison.
