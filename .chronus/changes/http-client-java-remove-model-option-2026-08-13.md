---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support removing models from management clients with the `remove-model` emitter option.

```yaml
options:
  "@typespec/http-client-java":
    remove-model:
      - ModelToRemove
```
