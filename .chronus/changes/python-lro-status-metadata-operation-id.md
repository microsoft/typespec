---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Generate `MetadataLROPoller` and `AsyncMetadataLROPoller` for Azure operations using `@lroStatusMetadata` or `@lroOperationId`. Their `details` and `operation_id` properties expose selected monitor metadata and server-issued identifiers, refresh on polling, and repopulate after resuming from a continuation token. Operations without these annotations retain their existing pollers.

```python
poller = client.begin_analyze(document)
result = poller.result()
print(poller.operation_id)
print(poller.details)
```
