---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Add a `generate-typeddict` emitter option (default `true`) that controls `TypedDict` generation independently of `models-mode`. `models-mode` now toggles just `dpg` and `none`; the `typeddict` value is deprecated. 
