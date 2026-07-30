---
changeKind: feature
packages:
  - "@typespec/http-server-csharp"
---

Add `exclude-interfaces` emitter option to skip controller and business-logic interface generation for specified TypeSpec interfaces.

```yaml
# tspconfig.yaml
options:
  "@typespec/http-server-csharp":
    exclude-interfaces:
      - Operations
```
