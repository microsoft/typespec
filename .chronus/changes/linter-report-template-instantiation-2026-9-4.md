---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Report linter diagnostics on library templates that the user project instantiated

A rule reporting on a type declared inside a library template — for example the `value` property of `Wrapper<T>` when the project writes `Wrapper<uuid>` — was silently dropped, because the target's source location resolves to the template declaration in the library. Such a type only exists because of the template arguments the user passed, so the diagnostic is now reported with the instantiation trace pointing back at the user's own code, matching how non-linter diagnostics already behave.
