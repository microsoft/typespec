---
changeKind: fix
packages:
  - "typespec-vscode"
---

Ensure operation telemetry events always carry a valid `result` value. Previously the `start-extension` event (and any other operation whose callback returned `void`) was sent with `result="undefined"` and classified as an error event. The `doOperationWithTelemetry` callback is now constrained to return `ResultCode | Result<...>`, so the result is always derived from the operation's return value.
