# TypeSpec Language Support for Visual Studio

[Repository](https://github.com/microsoft/typespec) | [Documentation](https://typespec.io/docs) | [Issues](https://github.com/microsoft/typespec/issues) | [Samples](https://github.com/microsoft/typespec/tree/main/packages/samples/specs)

This provides provides [TypeSpec](https://github.com/microsoft/typespec) language support for Visual Studio.

## Features

- Live diagnostic reporting
- Syntax highlighting
- Code completion
- Code folding
- Formatting
- Hover info
- Rename refactoring
- Go to definition

## Configure TypeSpec Visual Studio Extension

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
