---
changeKind: feature
packages:
  - "@typespec/compiler"
---

`createTester` now mounts each discovered library's `tspconfig.yaml` into the virtual file system, so experimental features a library opts into (e.g. `auto-decorators`) are honored when compiling against the tester.
