---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix decorators running with unresolved template parameters when a decorated template is used as a template parameter default of an operation (e.g. `op foo<Resource, Properties = Decorated<Resource>>(...)`, the ARM `TagsUpdateModel<Resource>` pattern). Operations now enter the template declaration scope before resolving template parameter defaults, so decorators on those defaults are no longer executed with the still-unresolved template parameter. This matches the existing behavior for models and interfaces.
