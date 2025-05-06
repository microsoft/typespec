---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fixed a few bugs with output directory resolution logic in `hsjs-scaffolding`, improving robustness of the scaffolding script by re-using existing compiler logic to resolve emitter options.