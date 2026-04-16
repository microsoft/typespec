---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add mock API test cases for `@responseAsBool` and `@clientDoc` decorators (from Azure/typespec-azure#4268). Fix code generation for `@responseAsBool` HEAD operations to return boolean values directly without attempting JSON body deserialization.
