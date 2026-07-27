---
changeKind: feature
packages:
  - "@typespec/tspd"
---

Add a `--rules-dir` option (and `rulesDir` API option) to `tspd doc` to control where per-rule reference pages are written. Defaults to `rules` (relative to `--output-dir`); can be set to a path escaping the output dir (e.g. `../rules`) to keep rule pages outside the generated reference folder.
