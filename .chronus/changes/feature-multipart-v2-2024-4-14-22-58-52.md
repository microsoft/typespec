---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/http"
---

Add new multipart handling. Using `@multipartBody` with `HttpPart<Type, Options>`. See [multipart docs] for more information https://typespec.io/docs/next/libraries/http/multipart
  
  ```tsp
  op upload(@header contentType: "multipart/mixed", @multipartBody body: {
    name: HttpPart<string>;
    avatar: HttpPart<bytes>[];
  }): void;
  ```
