---
changeKind: fix
packages:
  - "@typespec/playground"
---

Add support for deferring the loading of emitter libraries until they are selected. Configure with the new `deferredEmitters` option to avoid downloading and evaluating large emitters on startup.
