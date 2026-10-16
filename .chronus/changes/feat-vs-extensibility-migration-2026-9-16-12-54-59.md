---
changeKind: breaking
packages:
  - typespec-vs
---

Migrate the Visual Studio extension to out-of-process VisualStudio.Extensibility on .NET 8. Requires Visual Studio 2022 17.14 or newer. This preview does not yet migrate the tspconfig.yaml language-server association, explicit closed-file watching, client configuration updates, or aggregated workspace settings.