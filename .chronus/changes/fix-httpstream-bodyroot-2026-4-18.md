---
changeKind: fix
packages:
  - "@typespec/http"
---

Fix `HttpStream` to use `@bodyRoot` instead of `@body` so that the `@header contentType` property is not silently ignored, eliminating spurious `@typespec/http/metadata-ignored` warnings on every `SSEStream` instantiation.
