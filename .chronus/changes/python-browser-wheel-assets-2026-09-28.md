---
changeKind: fix
packages:
  - "@typespec/http-client-python"
  - "@typespec/playground"
---

Generate Python clients from shared Playground links by preserving their emitter configuration and falling back to published Pyodide and browser-compatible wheels when public package services are unavailable.
