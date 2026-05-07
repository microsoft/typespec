---
changeKind: feature
packages:
  - "@typespec/protobuf"
---

Map TypeSpec optionality (`?`) to protobuf `optional` where appropriate.

- `optional` is applied to fields with protobuf scalar types to set explicit presence.
- `optional` is _not_ applied to fields with message types, because they _always_ have explicit presence.
- Attempting to convert a TypeSpec optional property where the type is an array or `Protobuf.Map` instance produces a warning, because protobuf cannot differentiate between "empty" and "unset" `repeated`/`map`-typed fields.
