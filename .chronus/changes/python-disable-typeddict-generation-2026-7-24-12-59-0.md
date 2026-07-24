---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Add a `generate-typeddict` emitter option to opt out of generating `TypedDict` request-body overloads in `models-mode: dpg`. Defaults to `true`; set it to `false` to disable the DPG `TypedDict` overloads.
