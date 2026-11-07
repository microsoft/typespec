---
changeKind: fix
packages:
  - "@typespec/http"
---

Allow `null` values in `Record` properties transformed by `MergePatchUpdate` and `MergePatchCreateOrUpdate` to support per-key deletion.
