---
changeKind: fix
packages:
  - "@typespec/protobuf"
---

An object value, such as an `@opExample` or `const` value, can now fill a `Map<Key, Value>`: `Map` is a `Record` of its values. The emitted `map` is unchanged.
