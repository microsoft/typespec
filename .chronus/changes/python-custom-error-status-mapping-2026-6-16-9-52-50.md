---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Always populate the operation `error_map` with the standard azure-core error types (401 → `ClientAuthenticationError`, 404 → `ResourceNotFoundError`, 409 → `ResourceExistsError`, 304 → `ResourceNotModifiedError`), even when a customized error model covers those status codes. Previously, a standard status code covered by a customized ranged or default error model fell back to a generic `HttpResponseError`; it now raises its dedicated error type via `map_error`. The customized error body continues to be deserialized and attached to the `HttpResponseError` raised for other (non-standard) status codes.
