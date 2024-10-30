---
changeKind: fix
packages:
  - typespec-vscode
---

1. TypeSpec Language Server would be restarted with new settings when setting "typespec.tsp-server.path" is changed
2. Typespec Language Server can be restarted properly when the server wasn't running before
