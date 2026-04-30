---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add test case for `@responseAsBool` HEAD operation (Spector scenario `azure/client-generator-core/response-as-bool`). Fix Python generator to return constant literal values directly for `@responseAsBool` responses instead of attempting to parse the empty HEAD response body.
