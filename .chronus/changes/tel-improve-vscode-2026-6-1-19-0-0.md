---
changeKind: fix
packages:
  - "typespec-vscode"
---

Improved telemetry instrumentation for `install-global-compiler-cli`, `preview-openapi3`, `start-server`, and `server-path-changed` events by adding missing `lastStep` tracking and error detail logging. Added actionable error message when compiler is found but neither `node` nor `tsp` is available on PATH, guiding users to fix common nvm/fnm/volta configuration issues.
