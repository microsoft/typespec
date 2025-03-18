---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixed an issue where the `--emit-files` flag on emitters with nested folders was not generating the correct paths to the files.
