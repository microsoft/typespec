---
changeKind: internal
packages:
  - typespec-vscode
---

Stabilize the VS Code e2e tests against new VS Code releases. `test:web` and `test:extension` both pulled the *latest* VS Code build, so the VS Code 1.130.0 release hung the E2E CI job indefinitely across unrelated PRs. Skip `test:web` and pin the extension test host to a known-good VS Code version.
