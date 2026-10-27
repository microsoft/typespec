---
changeKind: fix
packages:
  - "@typespec/playground"
  - "@typespec/html-program-viewer"
---

Declare React, React DOM, and Fluent UI packages as peer dependencies with permissive ranges so consuming applications can share their UI dependencies without duplicate React installations.