---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Generate structured JSONL (`application/jsonl`) and SSE (`text/event-stream`) response streams for the Azure flavor. Generated methods return standard `Generator[T, None, None]` or `AsyncGenerator[T, None]` values that yield deserialized model instances. Unbranded response streams remain raw-byte iterators.

```python
for thing in client.receive():
    ...
```
