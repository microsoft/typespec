---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `typeTarget` to report diagnostics at the syntax that expresses a type in another declaration, instead of where that type is declared. Paths go through spreads, `is`, intersections and template arguments, so a linter rule can report a library declaration where the project uses it.

```ts
// `never` in `op getUser(): never`
typeTarget(program, op, "returnType");

// `SharedQuery` in `op list(...SharedQuery): void`, even when `SharedQuery` is declared in a library
typeTarget(program, op, "parameters").property("top");
```
