---
changeKind: internal
packages:
  - "@typespec/http-client-java"
---

Remove legacy AutoRest settings. `AutorestSettings` is renamed to `ProjectSettings` and only retains `output-folder`; the unused `java-sdks-folder` and `title` options, the `SwaggerReadmeTemplate` generation, and the AutoRest `tag` based service description are removed (management service description now uses the api-version instead).
