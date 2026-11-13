---
changeKind: internal
packages:
  - "@typespec/http-client-java"
---

Reduce the shipped generator size by keeping only the vendored Eclipse formatter code reachable from the generator's formatter entry point. Constant parameters, fields, named constants, and constant returns are inlined; unread fields, unused parameters, empty methods, unobserved AST bookkeeping, and the compiler's binding layer are removed; single-implementation and marker types are folded; and vendored Javadoc and comments no longer reference removed or upstream-only code. Diagnostics stay English-only, and generated Java formatting is unchanged.
