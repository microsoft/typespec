---
title: TypeSpec VSCode extension
---

## Installation

:::note
Extension is not available yet in the marketplace and must be installed via the command line.
:::

```bash
tsp code install

# For VSCode insiders
tsp code install --insiders
```

## Configure

TypeSpec wil interpolate a few variables using this pattern `${<name>}`. For example `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Corespond to the root of your Visual Studio workspace.

### `typespec.tsp-server.path`: Configure the server path

There are cases where the TypeSpec project is located in a subfolder. In such cases, the TypeSpec extension is not able to find the tsp compiler automatically and needs a little guidance.
This setting provides the ability to configure where the tsp compiler is located.

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

## Uninstall

Uninstalling can be done via the Visual Studio Code extension manager or via the command line:

```bash
tsp code uninstall

# For VSCode insiders
tsp code uninstall --insiders
```
