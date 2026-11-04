---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Validate that a paging operation with a request `@continuationToken` also returns a response `@continuationToken`, including when the response has `@nextLink`. Previously accepted request-only annotations now produce an error; for link-based pagination without a separate response token, remove `@continuationToken` from the request parameter.
