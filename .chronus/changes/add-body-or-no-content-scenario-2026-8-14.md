---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add scenario for an operation whose successful response is either a model body (`200`) or no content (`204`).

```tsp
op getBody(): {
  @statusCode statusCode: 200;
  @body layout: BlobLayout;
} | {
  @statusCode statusCode: 204;
};
```
