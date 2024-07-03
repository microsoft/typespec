---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

Keep trailing slash when building http routes, this is breaking if you used to have `@route()` ending with `/`.
  
  | TypeSpec                                                         | Before            | After              |
  | ---------------------------------------------------------------- | ----------------- | ------------------ |
  | `@route("users/")`                                               | `users`           | `users/`           |
  | `@route("users")`                                                | `users`           | `users`            |
  | on interface `@route("users/")` and on op `@route("addresses/")` | `users/addresses` | `users/addresses/` |
  | on interface `@route("users/")` and on op `@route("addresses")`  | `users/addresses` | `users/addresses`  |
