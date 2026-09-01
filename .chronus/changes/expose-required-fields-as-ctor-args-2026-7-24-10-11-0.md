---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Expose the `required-fields-as-ctor-args` emitter option in `tspconfig.yaml`. It controls whether required model properties are generated as constructor arguments. The default remains `true`.

```yaml
options:
  "@typespec/http-client-java":
    required-fields-as-ctor-args: false
```
