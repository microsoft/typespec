---
changeKind: feature
packages:
  - "@typespec/http-server-csharp"
---

Add `include-operations-controller` emitter option (boolean, default `false`) to control whether a controller and business-logic interface are generated for the ARM Operations endpoint. Set to `true` to include the Operations controller.

```yaml
# tspconfig.yaml
options:
  "@typespec/http-server-csharp":
    include-operations-controller: true
```
