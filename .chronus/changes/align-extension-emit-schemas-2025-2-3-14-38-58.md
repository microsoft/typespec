---
changeKind: breaking
packages:
  - "@typespec/openapi"
---

Updates the `@extension` decorator to accept Types in addition to Values. Model and Tuple expressions that were previously treated as Values are now treated as Types.