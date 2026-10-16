---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support continuation-token pagination in Azure Java clients. Tokens are hidden from client method signatures; resume through the paging API:

```java
client.list().streamByPage(token);
```
