# Cadl Language Support for VS Code

This provides provides [Cadl](https://github.com/microsoft/cadl) language support for VS Code.

See https://github.com/microsoft/cadl#installing-vs-code-extension for installation instructions.

**NOTE**: The npm package is used as an implementation detail of the `cadl vscode` command that installs the Visual Studio Cadl extension, and not intended to be used for other purposes.

## Configure VSCode extension

Cadl wil interpolate a few variables using this pattern `${<name>}`. For example `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Corespond to the root of your Visual Studio workspace.

### `cadl.cadl-server.path`: Configure the server path

There are cases where the Cadl project is located in a subfolder. In such cases, the Cadl extension is not able to find the cadl compiler automatically and needs a little guidance.
This setting provides the ability to configure where the cadl compiler is located.

```json
{
  "cadl.cadl-server.path": "${workspaceFolder}/mynestedproject/node_modules/@cadl-lang/compiler"
}
```
