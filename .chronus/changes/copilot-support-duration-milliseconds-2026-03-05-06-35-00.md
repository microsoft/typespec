---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support `DurationKnownEncoding.milliseconds` in http-client-java. Duration properties encoded as milliseconds now use `Duration` as the client type, with proper conversion to/from integer or float milliseconds on the wire.
