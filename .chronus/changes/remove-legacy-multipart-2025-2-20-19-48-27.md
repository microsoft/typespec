---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

Remove support for deprecated implicit multipart, migrate to explicit part with `@multipartBody` and `HttpPart<T>`

  ```diff lang=tsp
  op upload(
    @header contentType: "multipart/form-data",
  -  @body body: {
  +  @multipartBody body: {
  -    name: string;
  +    name: HttpPart<string>;
  -    avatar: bytes;
  +    avatar: HttpPart<bytes>;
    }
  ): void;
  ```
