---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Support `datetime.timedelta` for `duration` types encoded as `seconds` or `milliseconds`. SDK users can now pass a `datetime.timedelta` (instead of a raw `int`/`float`) and responses are deserialized back into `datetime.timedelta`.
