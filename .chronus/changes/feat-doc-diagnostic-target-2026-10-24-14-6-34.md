---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `getDocDiagnosticTarget` to report diagnostics at the source of documentation, including inherited documentation.

```ts
const target = getDocDiagnosticTarget(program, type) ?? type;
context.reportDiagnostic({ target });
```