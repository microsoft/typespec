---
changeKind: feature
packages:
  - typespec-vscode
---

Enhance logging and trace
 1. Support "Developer: Set Log Level..." command to filter logs in TypeSpec output channel
 2. Add "typespecLanguageServer.trace.server" config for whether and how to send the traces from TypeSpec language server to client. (It still depends on client to decide whether to show these traces based on the configured Log Level.)
 3. More logs and traces are added for diagnostic and troubleshooting
