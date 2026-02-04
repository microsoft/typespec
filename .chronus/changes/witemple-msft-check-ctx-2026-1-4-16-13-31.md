---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixed several checking errors around template instantiations that could cause TemplateParameter instances to leak into decorator calls.