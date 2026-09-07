---
changeKind: fix
packages:
  - "@typespec/tspd"
---

Honor the library's own `tspconfig.yaml` when generating signatures and reference documentation, so
libraries that opt into a compiler feature (such as `auto-decorators`) no longer report errors during
`gen-extern-signature` and `doc`.
