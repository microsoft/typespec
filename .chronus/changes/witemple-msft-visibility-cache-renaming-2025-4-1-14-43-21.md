---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added an optional `nameTemplate` argument to `@withVisibilityFilter`, allowing the visibility filters to rename models as they are transformed. This template is applied by default in the `Create`, `Read`, `Update`, `Delete`, and `Query` visibility transform templates. This allows for more flexible renaming than simply using the `@friendlyName` decorator, as it will change the primary name of the transformed type, reducing the incidence of naming conflicts.

Cached the result of applying visibility filters to types. If the same visibility filter is applied to the same type with the same configuration, the model instance produced by the visibility filter will be object-identical. This should reduce the incidence of multiple models that are structurally equivalent in visibility filters and conflicts over the name of models.
