---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Subclient parameters are now included in accessor methods. When a subclient has different constructor parameters from its parent, the parent client now generates an accessor method (instead of no accessor) that accepts the subclient's unique parameters and uses stored shared parameters to create the subclient.
