---
changeKind: fix
packages:
  - "@typespec/http"
---

Emit a `head-verb-body` warning when a `@head` operation response contains a body (which is against the HTTP spec). Additionally, fix the incorrect content-type handling that previously caused body content-types to be moved to headers when using `@head` verb with response models that contain both a content-type header and body properties.
