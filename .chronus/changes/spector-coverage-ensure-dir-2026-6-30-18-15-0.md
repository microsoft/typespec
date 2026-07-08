---
changeKind: fix
packages:
  - "@typespec/spector"
---

Ensure the coverage file's parent directory is created before writing so `tsp-spector serve --coverageFile <path>` no longer silently drops the report when the directory is missing
