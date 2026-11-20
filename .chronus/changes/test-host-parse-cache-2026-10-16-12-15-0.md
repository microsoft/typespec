---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Testers now reuse parsed library files across compilations, which speeds up library test suites. Parsed scripts are also reused again when no `parseOptions` are specified.
