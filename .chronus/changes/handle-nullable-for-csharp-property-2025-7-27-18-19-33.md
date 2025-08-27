---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Avoid generating double '?' after property name when the property is nullable union and it's prop.optional is true in the meantime
