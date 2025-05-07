---
changeKind: fix
packages:
  - "@typespec/http"
---

Fix diagnostic for `PatchOptions.implicitOptionality`, which refers a non-existing property and the incorrect value.
To keep the old behavior, you will need to use `@patch(#{ implicitOptionality: true })` instead.
