---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support `@access(Access.internal)` for ARM operations, models, and enums.

```typespec
@@access(Widgets.inspect, Access.internal, "java");
@@access(InternalResult, Access.internal, "java");
```
