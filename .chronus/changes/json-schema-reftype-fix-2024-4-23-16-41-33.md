---
changeKind: fix
packages:
  - "@typespec/json-schema"
---

The emitted JSON Schema now doesn't make root schemas for TypeSpec types which do not have the @jsonSchema decorator or are contained in a namespace with that decorator. Instead, such schemas are put into the $defs of any root schema which references them, and are referenced using JSON Pointers.
