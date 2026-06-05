---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixed compiler crash when a decorator is called with a function argument that contains an invalid reference. The decorator is now correctly skipped and an error diagnostic is reported instead of passing the raw return type to the decorator implementation.
