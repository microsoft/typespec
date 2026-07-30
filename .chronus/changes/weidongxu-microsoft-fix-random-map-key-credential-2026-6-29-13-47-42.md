---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fixed an issue where a randomly generated JSON map key in the mock test could contain a credential phrase (e.g. key) and be unexpectedly redacted to fakeTokenPlaceholder by the test proxy.