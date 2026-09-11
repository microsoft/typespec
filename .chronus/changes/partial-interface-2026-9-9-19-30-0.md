---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add support for `partial` interfaces. A `partial interface` can be declared multiple times, including across different files, and every matching declaration must be marked `partial`. All operations, decorators, and `extends` clauses from each declaration are combined into a single interface.

```typespec
// a.tsp
partial interface Widgets {
  list(): void;
}

// b.tsp
partial interface Widgets {
  read(id: string): void;
}
```
