---
changeKind: fix
packages:
  - "@typespec/http-client-js"
  - "@typespec/http-client"
  - "@typespec/compiler"
---

Allow optional credential when `NoAuth` is present in `@useAuth` union in `@typespec/http-client-js`, fix synthetic credential constructor cache collision across HTTP authentication schemes in `@typespec/http-client`, and fix `glob` exclude option in test host.
