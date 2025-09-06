---
changeKind: feature
packages:
  - typespec-vscode
---

1. Limit the vscode tasks to be created when the extension is starting
2. Do not include the emitters by default when compiling in LSP. Setting 'typespec.lsp.emit' can be used to configure the emitters to include explicitly (set to ['*'] to include all the emitters defined in tspconfig.yaml)
