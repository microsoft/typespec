---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support XML serialization for models: generate XmlSerializer helper classes and use the XML ObjectSerializer overload of toObject/fromObject in convenience methods for XML request/response bodies.