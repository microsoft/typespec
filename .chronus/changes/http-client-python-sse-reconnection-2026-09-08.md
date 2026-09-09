---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Automatically reconnect SSE streams after an unexpected disconnect, honoring server-provided retry delays and resuming with the latest event ID.

```python
with client.events.stream() as stream:
    for event in stream:
        print(event)
```
