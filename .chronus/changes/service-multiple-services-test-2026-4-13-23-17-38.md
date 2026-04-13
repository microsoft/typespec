---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add mock API tests for `service/multiple-services` Spector scenario, covering `ServiceAClient` and `ServiceBClient` with separate versioned operation groups. Fix Python code generator to merge operation groups with the same class name across multiple clients in the same namespace, avoiding duplicate class definitions.
