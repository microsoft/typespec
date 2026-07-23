---
changeKind: internal
packages:
  - typespec-vscode
---

Temporarily skip the VS Code e2e tests. Both `test:web` and `test:extension` pull the *latest* VS Code build, so the VS Code 1.130.0 release hung the E2E CI job indefinitely across unrelated PRs. They will be re-enabled once the test host is pinned to a known-good version and guarded with a timeout.
