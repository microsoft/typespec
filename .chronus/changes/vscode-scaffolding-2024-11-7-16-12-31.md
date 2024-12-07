---
changeKind: internal
packages:
  - "@typespec/html-program-viewer"
---

Update vite config to make "prompts" and "fs/promise" external which is referenced by "tsp init" part code, so indirectly referenced by compiler server when supporting "creating typespec project" feature. They are not be used in html-program-viewer.
