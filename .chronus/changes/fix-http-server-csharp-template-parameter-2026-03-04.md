---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix crash when emitting interfaces that contain template operations. Template operations (e.g. `getItem<T>(): T`) within interfaces will simply be skipped when emitting the interface.
