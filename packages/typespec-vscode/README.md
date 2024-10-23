# TypeSpec Language Support for VS Code

[Repository](https://github.com/microsoft/typespec) | [Documentation](https://typespec.io/docs) | [Issues](https://github.com/microsoft/typespec/issues) | [Samples](https://github.com/microsoft/typespec/tree/main/packages/samples/specs)

This provides provides [TypeSpec](https://github.com/microsoft/typespec) language support for VS Code.

![](https://raw.githubusercontent.com/microsoft/typespec/main/docs/images/vscode.gif)

## Features

- Live diagnostic reporting
- Syntax highlighting
- Code completion
- Code folding
- Formatting
- Hover info
- Rename refactoring
- Go to definition

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
