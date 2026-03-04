---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix crash when emitting interfaces that contain template operations. Template operations (e.g. `getItem<T>(): T`) within interfaces no longer cause "Encountered type TemplateParameter which we don't know how to emit" error.
