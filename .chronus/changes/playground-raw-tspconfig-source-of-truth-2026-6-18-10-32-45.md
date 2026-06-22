---
changeKind: feature
packages:
  - "@typespec/playground"
---

Make the raw `tspconfig.yaml` editor the source of truth so manual edits (comments, `output-dir`, `warn-as-error`, ordering and any unknown fields) are preserved instead of being reverted, compile by resolving the written `tspconfig.yaml` natively, and add language-server completion to the config editor.
