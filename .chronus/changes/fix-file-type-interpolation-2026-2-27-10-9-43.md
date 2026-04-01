---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Do not interpolate non primitive values in config automatically
  ```yaml
      file-type: ["json", "yaml"]
      output-file: "openapi.{file-type}"
  ```
  Will not be interpolated as `openapi.json,yaml` but keep the placeholder `{file-type}` intact for the emitter to handle.
