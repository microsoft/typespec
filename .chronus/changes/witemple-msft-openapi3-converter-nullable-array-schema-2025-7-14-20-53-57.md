---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

[Converter] fixed a bug that would cause nullable array schemas to generate as unions with only a `null` variant. These schemas now generate an array variant as well.
