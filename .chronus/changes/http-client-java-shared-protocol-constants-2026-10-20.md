---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Generate a shared ClientCoreConstants class for literal HTTP header names and statically known parameterized type tokens across clients and helpers. Preserve dynamic values and inaccessible local types while avoiding duplicate constant creation without annotation processing.
