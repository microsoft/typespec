---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix Python playground generation when PyPI wheel downloads are unavailable. Publish browser-compatible dependency wheels with the emitter instead of resolving and downloading them from PyPI at runtime.

Prepare these assets only for playground builds. Require patched package-manager versions (pip 26.2.0 or newer, uv 0.13.4 or newer) and pin build-environment pip to 26.2.2.
