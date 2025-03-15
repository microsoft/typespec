---
changeKind: deprecation
packages:
  - "@typespec/http"
---

Deprecate implicit multipart body

```diff lang=tsp
op upload(
  @header contentType: "multipart/form-data",
  -@body body: {
  +@multipartBody body: {
  -  name: string;
  +  name: HttpPart<string>;
  -  avatar: bytes;
  +  avatar: HttpPart<bytes>;
  }
): void;
```
