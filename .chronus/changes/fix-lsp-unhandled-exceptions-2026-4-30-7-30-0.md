---
changeKind: fix
packages:
  - typespec-vscode
---

Handle unhandled exceptions in VS Code extension: add custom error handler for server crashes with restart notification, wrap commands with graceful exception handling, and add null guards to prevent extension host errors when LSP client is unavailable
