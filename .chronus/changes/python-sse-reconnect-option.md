---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Make automatic SSE reconnection opt-in with the `enable-sse-reconnect` emitter option, which defaults to `false`. Without this option, SSE streams end at EOF without reconnect callbacks, retry delays, or `Last-Event-ID` request plumbing. SSE parsing, event ID and retry metadata, terminal events, and stream cleanup remain available.

Enable reconnection when generating the client:

```yaml
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
    enable-sse-reconnect: true
```
