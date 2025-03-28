---
changeKind: breaking
packages:
  - "@typespec/http"
  - "@typespec/openapi3"
---

Separate file bodies into their own `bodyKind`.

The HTTP library will now return a body with `bodyKind: "file"` in all cases where emitters should treat the body as a file upload or download. Emitters that previously attempted to recognize File bodies by checking the `type` of an HTTP `"single"` body may now simply check if the `bodyKind` is `"file"`. This applies to all HTTP payloads where an `HttpOperationBody` can appear, including requests, responses, and multipart parts.
