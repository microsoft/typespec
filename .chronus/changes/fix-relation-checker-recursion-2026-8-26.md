---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix a stack overflow when checking assignability of mutually recursive types

Checking whether a type was assignable to another one could recurse forever and crash the compiler with `RangeError: Maximum call stack size exceeded`. Two cases were affected:

- mutually recursive models, such as `model A { b: B }` / `model B { a: A }`
- any union reaching itself, such as `union Foo { self: Foo }`

The relation cache is now shared for the whole check instead of being recreated at every level, and unions seed it before walking their variants, so a cycle coming back to the same pair of types resolves instead of recursing.
