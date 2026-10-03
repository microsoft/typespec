---
changeKind: fix
packages:
  - "@typespec/http"
  - "@typespec/openapi3"
---

Improve how response descriptions are chosen when multiple responses share a status code. When an operation has multiple responses with the same HTTP status code, all responses sharing that code are considered when computing the description associated with that code instead of just one.

```tsp
@doc("A cat.")
model Cat { @statusCode _: 200, meow: boolean }

@doc("A dog.")
model Dog { @statusCode _: 200, bark: boolean }

// The response description defaults to "The request has succeeded."
// because the doc comments for the variants conflict.
op read(): Cat | Dog;
```
