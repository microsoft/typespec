---
changeKind: breaking
packages:
  - "@typespec/http"
---

Changed the default content-type resolution behavior as follows:

- As before, if the content-type header is _explicitly_ specified (`@header contentType: valueof string`), the explicit content type is used (this behavior has not changed).
- If the type of an HTTP payload body has a Media Type hint (`@mediaTypeHint`), that media type is preferred as the default content-type for the request.
- The default content-type for `TypeSpec.bytes` has been changed to `application/octet-stream` to avoid serializing the data to base64-encoded JSON.
- The default content-type for all other scalar types has been changed to `text/plain` (previously, it was `application/json`).
- For multipart payloads, the default content-type of the payload has been changed to `multipart/form-data` if the `@multipartBody` parameter has a Model type and `multipart/mixed` if the multipart payload has a tuple type.
  - The content-type of individual parts in the multipart request has been changed to be the same as for HTTP payload bodies and follows the logic described above.
