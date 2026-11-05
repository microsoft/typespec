---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Generate only the ClientCore protocol helper methods and imports each library uses, retaining transitive helper dependencies. Reduce repeated request-context, optional-body/content-type, and mixed JSON/XML serialization code without changing ClientCore dependencies or requiring annotation processing.
