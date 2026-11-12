---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add the Java `collectionHeaderPrefix` client option for map-valued headers:

```typespec
@@clientOption(MetadataHeaders.metadata, "collectionHeaderPrefix", "x-ms-meta-", "java");
```

The generated client deserializes response headers with the configured prefix into the map.
