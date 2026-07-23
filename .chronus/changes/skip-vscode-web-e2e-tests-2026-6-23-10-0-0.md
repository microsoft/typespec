---
changeKind: internal
packages:
  - typespec-vscode
---

Skip the VS Code web e2e tests (`test:web`) in `test:e2e`. `vscode-test-web --quality stable` always pulls the latest VS Code build and has no timeout, so the VS Code 1.130.0 release hung the E2E CI job indefinitely across unrelated PRs.
