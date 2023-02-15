# TypeSpec Language Support for Visual Studio

This package provides [TypeSpec](https://github.com/microsoft/typespec) language support for Visual Studio 2019 and 2022.

See https://github.com/microsoft/typespec#installing-visual-studio-extension for installation instructions.

**NOTE**: The npm package is used as an implementation detail of the `tsp vs` command that installs the Visual Studio TypeSpec extension, and not intended to be used for other purposes.

## Configure TYPESPEC Visual Studio Extension

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
