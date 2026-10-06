---
changeKind: fix
packages:
  - "@typespec/protobuf"
---

Report an error when two fields of the same message use the same field index or name, instead of emitting an invalid Protobuf file.
