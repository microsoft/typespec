# TypeSpec Language Support for VS Code

This provides provides [TypeSpec](https://github.com/microsoft/typespec) language support for VS Code.

See https://github.com/microsoft/typespec#installing-vs-code-extension for installation instructions.

**NOTE**: The npm package is used as an implementation detail of the `tsp vscode` command that installs the Visual Studio TypeSpec extension, and not intended to be used for other purposes.

## Configure VSCode extension

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
