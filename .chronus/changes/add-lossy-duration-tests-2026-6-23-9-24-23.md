---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add mock API test cases for encode/duration lossy scenarios (int32-seconds and int32-milliseconds) verifying that durations with fractional precision are serialized as integers
