---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix generated class/interface names incorrectly receiving a `_2` suffix (e.g. `OperationsController_2`, `IOperations_2`, `ErrorResponse_2`) when a non-service library namespace (such as `Azure.ResourceManager`) defines types with the same name as types in the `@service` namespace. The emitter now restricts its collection of interfaces and models to `@service`-decorated namespaces, preventing the naming collision.
