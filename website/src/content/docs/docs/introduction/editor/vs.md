---
title: Visual Studio Extension
---

## Installation

The extension requires **Visual Studio 2022 17.14 or newer** and runs out of process using VisualStudio.Extensibility on .NET 8.

Install the extension via the Visual Studio extension manager from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=typespec.typespecvs).

:::caution[Migration preview]
The new language-server integration uses a preview API and is not yet at feature parity with the previous extension. Language-server document associations cover `.tsp` and `.cadl` files only; TypeSpec-specific language features for `tspconfig.yaml` are not available in this preview. Explicit closed-file watching, client configuration updates, and aggregated workspace settings are not yet migrated. See the [migration notes](https://github.com/microsoft/typespec/tree/main/packages/typespec-vs#migration-preview) for the remaining validation work.
:::

## Configure

1. Create a file named `.vs/VSWorkspaceSettings.json` in the open folder or the directory containing the solution.
2. Add the configuration as a key-value pair in this file. For example:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

The `${workspaceFolder}` variable expands to the open folder or the directory containing the solution. Relative server paths are resolved from that same directory.

## Uninstall

You can uninstall the extension via the Visual Studio extension manager or through the command line:

```bash
tsp vs uninstall
```
