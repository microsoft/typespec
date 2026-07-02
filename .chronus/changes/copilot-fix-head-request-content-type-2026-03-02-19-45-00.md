---
changeKind: fix
packages:
  - "@typespec/http"
---

- Emit a `head-no-body` warning when a `@head` operation response contains a body (HTTP spec: "head request must not return a message-body in the response").
- Fix the `content-type-ignored` warning incorrectly firing for `@head` responses that have a content-type header but no body.
