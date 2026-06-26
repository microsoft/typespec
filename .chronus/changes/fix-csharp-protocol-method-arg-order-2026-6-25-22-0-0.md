---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix protocol method call site passing arguments to the `CreateRequest` method in the wrong order. When an optional parameter (such as an optional path parameter) appeared before a required body parameter, the protocol method reordered its parameters required-first, which differs from the `CreateRequest` method's declaration order. The generated call site now maps each argument to the matching `CreateRequest` parameter by name so the values are passed in the order the request builder expects.
