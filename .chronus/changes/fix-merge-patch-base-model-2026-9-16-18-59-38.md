---
changeKind: fix
packages:
  - "@typespec/http"
---

Apply the `MergePatchUpdate` and `MergePatchCreateOrUpdate` transform to the base model of a model that uses `extends`, so inherited properties become optional in the patch shape instead of coming from the unpatched base model. Inherited properties now get the same checks as the model's own: a visible inherited metadata property reports `merge-patch-contains-metadata`, and a base model with `@friendlyName` reports `duplicate-type-name` in OpenAPI when the original base is also emitted, as nested models already do.
