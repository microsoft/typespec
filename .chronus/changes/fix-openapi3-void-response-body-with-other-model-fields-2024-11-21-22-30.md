---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Allow void to be the response body type when other fields are present in the model. Previously, using `void` as a response body type would fail compilation if the model contained other fields (like `statusCode`).
