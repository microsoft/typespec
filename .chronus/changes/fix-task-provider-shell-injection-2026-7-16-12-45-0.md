---
changeKind: fix
packages:
  - "typespec-vscode"
---

Fix a shell command injection in the tsp compile task provider. Tasks now run via `vscode.ProcessExecution` with arguments passed as an array instead of `vscode.ShellExecution`, so workspace file paths and task arguments are no longer interpreted by the OS shell. The task `args` is now specified as an array of arguments.
