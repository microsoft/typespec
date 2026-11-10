---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fixed an issue where the generated sample for a pageable method included the hidden maxpagesize parameter, producing code that did not match the client method signature.