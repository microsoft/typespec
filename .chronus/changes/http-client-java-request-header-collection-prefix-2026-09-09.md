---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support the Java `collectionHeaderPrefix` client option for map-valued request headers:

```typespec
@@clientOption(MetadataHeaders.metadata, "collectionHeaderPrefix", "x-ms-meta-", "java");
```
