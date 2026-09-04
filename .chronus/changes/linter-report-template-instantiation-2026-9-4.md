---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Report linter diagnostics on library template members whose type the user supplied

A rule reporting on a member declared inside a library template — for example the `value` property of `Wrapper<T>` when the project writes `Wrapper<uuid>` — was silently dropped, because the member's source location resolves to the template declaration in the library. That member only has the type it has because of the argument the user passed, so it is now reported, on the argument in the user's own file.

Members whose type the library declared itself are still not reported, so a rule never blames the user for code they cannot change.
