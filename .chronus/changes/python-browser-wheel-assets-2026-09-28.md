---
changeKind: fix
packages:
  - "@typespec/http-client-python"
  - "@typespec/playground"
---

Generate Python clients from shared Playground links by preserving their emitter configuration and loading Pyodide and browser-compatible wheels from published package assets instead of fetching dependencies from public package services.
