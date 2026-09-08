---
changeKind: fix
packages:
  - "@typespec/json-schema"
---

Sanitize declaration names used as file names so a declaration named with a backticked identifier containing path separators cannot write the schema outside of the emitter output dir.
