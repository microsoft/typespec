---
title: TypeSpec Visual Studio Extension
---

## Installation

Install the extension via the Visual Studio extension manager from the [TypeSpec for Visual Studio - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vs).

## Configure

1. Create a file named `.vs/VSWorkspaceSettings.json` at the root of the project.
2. Add the configuration as a key-value pair in this file. For example:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

TypeSpec will interpolate a few variables using this pattern: `${<name>}`. For example: `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Corresponds to the root of your Visual Studio workspace.

## Uninstall

You can uninstall the extension via the Visual Studio extension manager or through the command line:

```bash
tsp vs uninstall
```
