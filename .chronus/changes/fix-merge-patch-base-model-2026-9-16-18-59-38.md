---
changeKind: fix
packages:
  - "@typespec/http"
---

Apply the `MergePatchUpdate` and `MergePatchCreateOrUpdate` transform to the base model of a model that uses `extends`, so inherited properties become optional in the patch shape instead of coming from the unpatched base model. A visible inherited metadata property now reports `merge-patch-contains-metadata`, as the model's own properties do, unless the derived model overrides it. A transformed model or union with `@friendlyName` now gets a friendly name from the same name template, such as `BaseDtoMergePatchUpdate` for `BaseDto`, so OpenAPI no longer reports `duplicate-type-name` when the original is also emitted.
