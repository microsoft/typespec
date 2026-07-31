---
changeKind: fix
packages:
  - "@typespec/bundler"
---

Include a library's own `tspconfig.yaml` in the generated bundle so per-library opt-ins (such as compiler `features`) are preserved when the library is loaded in the browser (e.g. in the playground).
