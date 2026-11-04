---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix Python playground generation when PyPI wheel downloads are unavailable. Upgrade Pyodide to 314.0.7 and PyYAML to 6.0.3. Use `loadPackage` with matching Pyodide CDN packages and published browser-compatible wheels instead of resolving dependencies through micropip at runtime.

Prepare these assets only for playground builds. Require patched package-manager versions (pip 26.2.0 or newer, uv 0.13.4 or newer) and pin build-environment pip to 26.2.2.
