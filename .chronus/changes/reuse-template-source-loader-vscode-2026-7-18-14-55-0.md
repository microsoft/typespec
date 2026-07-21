---
changeKind: internal
packages:
  - "typespec-vscode"
---

Reuse the compiler's `UriTemplateSource.loadIndex()` to load `tsp init` template indexes instead of the extension's own file/URL reading and JSON parsing, unifying how core and configured templates are loaded.
