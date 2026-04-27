---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix generated code for `@responseAsBool` operations to directly return the boolean constant value instead of attempting to parse the (empty) response body. Add Spector test coverage for `azure/client-generator-core/response-as-bool`.
