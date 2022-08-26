# Cadl Language Support for Visual Studio

This package provides [Cadl](https://github.com/microsoft/cadl) language support for Visual Studio 2019 and 2022.

See https://github.com/microsoft/cadl#installing-visual-studio-extension for installation instructions.

**NOTE**: The npm package is used as an implementation detail of the `cadl vs` command that installs the Visual Studio Cadl extension, and not intended to be used for other purposes.

## Configure CADL Visual Studio Extension

1. Create a file `.vs/VSWorkspaceSettings.json` at the root of the project.
2. Add configuration as key value pair in this file. Example:

```json
{
  "cadl.cadl-server.path": "${workspaceFolder}/mynestedproject/node_modules/@cadl-lang/compiler"
}
```

Cadl wil interpolate a few variables using this pattern `${<name>}`. For example `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Corespond to the root of your Visual Studio workspace.
