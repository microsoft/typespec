---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Switch the code model interchange format between the emitter and the Python generator from YAML to a graph-preserving JSON format. This removes the `js-yaml` and `PyYAML` dependencies and dramatically speeds up serialization for large specs (on the Azure network spec, end-to-end serialization dropped from ~29s to ~0.2s). The `emit-yaml-only` option is renamed to `emit-codemodel-only`.
