---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Corrected a bug that sometimes caused the generated server code to sometimes attempt to extract path parameters from the wrong location.

Fixed an issue that caused all generated helper modules to be emitted even if they were not used. Now, the generator will only emit the helper modules that are actually used by the generated code.
