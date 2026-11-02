---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Prevent Pylint `too-many-statements` errors in generated synchronous and asynchronous structured-stream operations with SSE event dispatch. Scope the suppression to operation implementations, leaving overload declarations and non-structured-stream operations unchanged.
