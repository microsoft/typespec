---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

`tsp code install` and `tsp vs install` now install the editor extensions from the marketplace instead of downloading the `typespec-vscode`/`typespec-vs` npm packages. `tsp code install` delegates to `code --install-extension microsoft.typespec-vscode`, and `tsp vs install` downloads the latest vsix from the Visual Studio Marketplace.

The `tsp code` and `tsp vs` commands (`install`/`uninstall`) are now deprecated. They keep working but emit a deprecation warning; install and manage the extensions directly from the marketplace instead.
