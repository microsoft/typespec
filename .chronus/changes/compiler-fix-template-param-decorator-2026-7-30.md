---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`applyDecoratorToType` now skips executing a decorator if any of its arguments is an unresolved `TemplateParameter` or `TemplateParameterAccess`. This is a safety-net guard — the checker already sets `skipDecorators: true` on template declarations — but makes the protection explicit and robust against future refactoring.
