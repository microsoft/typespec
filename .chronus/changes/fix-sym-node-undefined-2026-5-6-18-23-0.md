---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix `Sym.node` type to be `Node | undefined` and update `getSymNode` return type to accurately reflect that it may return `undefined` for symbols created without a node (e.g. the built-in `null` symbol). Update all callers to correctly handle the `undefined` case.
