---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Report linter diagnostics on library template members the user gave a type to

A rule reporting on a member declared inside a library template — for example the `value` property of `Wrapper<T>` when the project writes `Wrapper<uuid>` — was silently dropped, because the member's source location resolves to the template declaration in the library. That member only has the type it has because of the argument the user passed, so it is now reported, on the argument in the user's own file.

Only a member declared *as* the parameter, such as `value: T`, counts. A member the parameter merely appears inside, such as `value: T[]`, is still left alone: the array is the library's own declaration, so a diagnostic about it is the library's to fix no matter which item type the user passed.
