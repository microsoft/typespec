---
title: TypeSpec VSCode extension
---

## Installation

Install the extension via the Visual Studio Code extension manager https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode

## Configure

TypeSpec will interpolate a few variables using this pattern: `${<name>}`. For example: `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Corresponds to the root of your Visual Studio workspace.

### `typespec.tsp-server.path`: Configure the server path

There are cases where the TypeSpec project is located in a subfolder. In such cases, the TypeSpec extension is not able to find the tsp compiler automatically and needs a little guidance.
This setting allows you to configure where the tsp compiler is located:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

## Uninstall

You can uninstall the extension via the Visual Studio Code extension manager or through the command line:

```bash
tsp code uninstall

# For VSCode insiders
tsp code uninstall --insiders
```
