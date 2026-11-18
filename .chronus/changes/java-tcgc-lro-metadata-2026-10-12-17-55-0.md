---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Expose the LRO operation ID selected by `@lroOperationId` on supported typed poll-result models via `getOperationId()`. The poll-result model is available once a status response with a body is received; its body property takes precedence over the polling URL path. Polling continues to use the complete polling URL.

```java
SyncPoller<DocumentAnalysisStatus, DocumentAnalysisResult> poller = client.beginAnalyze("document-1");
String operationId = poller.poll().getValue().getOperationId();
```
