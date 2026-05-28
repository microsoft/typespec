---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix `duration` properties encoded as integer seconds/milliseconds (e.g. `@encode(DurationKnownEncoding.milliseconds, integer)`) to always serialize as integers. Previously, only `int32` wire types were treated as integer; other integer wire types (`integer`, `int64`, `safeint`, `int8`/`int16`, and unsigned variants) incorrectly serialized as floating-point values via `TimeSpan.TotalMilliseconds` / `TimeSpan.TotalSeconds`.
