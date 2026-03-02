---
changeKind: fix
packages:
  - "@typespec/http"
---

- Emit a `head-verb-body` warning when a `@head` operation response contains a body (which is against the HTTP specification).
- Fix incorrect content-type handling where body content-types were wrongly moved to headers when `@head` verb was used with response models containing both a content-type header property and body properties.
