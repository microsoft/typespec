---
changeKind: feature
packages:
  - "@typespec/compiler"
---

The language server now surfaces the extended documentation of diagnostics and linter rules when hovering over a reported error. If the diagnostic/rule provides `docs` (inline markdown or a `FileRef`), it is rendered in the hover, together with a link to the generated reference page when a documentation url is available.
