---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add project-scoped compiler feature flags to `tspconfig.yaml`. Compiler feature definitions
are tracked internally with descriptions.

```yaml title=tspconfig.yaml
kind: project
features:
  - internal-modifier
  - function-declarations
```
