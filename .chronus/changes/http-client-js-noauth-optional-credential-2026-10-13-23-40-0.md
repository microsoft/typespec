---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Make the client `credential` parameter optional when `NoAuth` is part of a `@useAuth` union (e.g. `BearerAuth | NoAuth`), so anonymous clients no longer need a credential.
