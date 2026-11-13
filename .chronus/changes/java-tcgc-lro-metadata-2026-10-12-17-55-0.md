---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support the LRO operation ID from `@lroOperationId`. Poll-result models now have a read-only `getOperationId()` method. It returns the operation ID from the status monitor response body when it is there, and otherwise from the polling URL. Polling still uses the complete polling URL. Status values from `@lroStatusMetadata` are available on the typed poll result.

```java
SyncPoller<DocumentAnalysisStatus, AnalyzeResult> poller = client.beginAnalyze();
String operationId = poller.poll().getValue().getOperationId();
```
