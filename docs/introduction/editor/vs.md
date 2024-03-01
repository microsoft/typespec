---
title: TypeSpec Visual Studio Extension
---

## Installation

Install the extension via the Visual Studio extension manager. [TypeSpec for Visual Studio - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=typespec.typespecvs)

```bash
tsp vs install
```

## Configure

1. Create a file `.vs/VSWorkspaceSettings.json` at the root of the project.
2. Add configuration as key value pair in this file. Example:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

TypeSpec wil interpolate a few variables using this pattern `${<name>}`. For example `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Correspond to the root of your Visual Studio workspace.

## Uninstall

Uninstalling can be done via the Visual Studio extension manager or via the command line:

```bash
tsp vs uninstall
```
