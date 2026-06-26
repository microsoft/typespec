---
changeKind: fix
packages:
  - "@typespec/bundler"
---

Skip exports that only expose a `typespec` entrypoint (e.g. `./emitter`, `./options`) when building the JS bundle. These exports have no JS module to bundle and their TypeSpec source files are already included via the sub-export compilation, so the bundler no longer fails with a "missing import or default entrypoint" error.
