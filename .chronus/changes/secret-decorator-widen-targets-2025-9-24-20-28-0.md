---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Widen target types for the `@secret` decorator to include Model, Union, and Enum types, in addition to existing Scalar and ModelProperty targets. This allows marking any data type as secret for comprehensive data sensitivity handling.