# TypeSpec Extension in Visual Studio Code

[Repository](https://github.com/microsoft/typespec) | [Documentation](https://typespec.io/docs) | [Issues](https://github.com/microsoft/typespec/issues) | [Samples](https://github.com/microsoft/typespec/tree/main/packages/samples/specs)

The TypeSpec extension for Visual Studio Code enhances the development of TypeSpec by leveraging VS Code's powerful features. It provides:

- IntelliSense and syntax highlighting
- Code autocompletion and formatting
- Live diagnostics and quick fixes
- Refactoring tools (rename, go-to definition, etc.)
- Seamless project setup and emitter configuration
- Generate code from TypeSpec

## Prerequisites

Before using the TypeSpec extension, install [Node.js](https://nodejs.org/en/download/) and verify npm is available:

```sh
npm --version
```

Other necessary installations will be prompted within the extension as needed.

## Features

### Writing TypeSpec

- **IntelliSense & Auto-completion**: Code faster with smart suggestions.
- **Code Formatting & Folding**: Keep your code clean and organized with built-in formatting and folding support.
- **Syntax Highlighting**: Clear and readable TypeSpec syntax.
- **Live Diagnostics**: Get real-time feedback on code issues.
- **Quick Fixes & Refactoring**: Rename, go-to definition, and format with ease.
- **Hover Info**: Get detailed information about TypeSpec elements by hovering over them.

![vscode.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode.gif)

### Project Initialization

- **Create TypeSpec Project**: Easily initialize a new TypeSpec project based on a template, ensuring a structured and ready-to-use setup.
  ![vscode_project_scaffolding.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_project_scaffolding.gif)

### Generating Code from TypeSpec

The extension allows generating various outputs from TypeSpec:

- **OpenAPI Specification**
- **Server SDKs**: Generate server stubs for different back-end frameworks.
- **Client SDKs**: Generate client code for multiple languages, including:
  - .NET (C#)
  - Python
  - Java
  - JavaScript/TypeScript

Invoke `TypeSpec: Generate From TypeSpec` to generate code:

![vscode_tsp_to_openapi3_generation.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_tsp_to_openapi3_generation.gif)

## Commands

The extension provides the following commands:

| **Command**                                        | **Description**                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `TypeSpec: Create TypeSpec Project`                | Scaffold a new TypeSpec project.                                    |
| `TypeSpec: Install TypeSpec Compiler/CLI globally` | Install the TypeSpec Compiler/CLI globally.                         |
| `TypeSpec: Generate From TypeSpec`                 | Compile and generate from TypeSpec files into the specified output. |
| `TypeSpec: Restart TypeSpec Server`                | Restart the TypeSpec language server.                               |
| `TypeSpec: Show Output Channel`                    | Open the TypeSpec output channel to view logs.                      |

## Configuration

TypeSpec will interpolate a few variables using this pattern `${<name>}`. For example `${workspaceFolder}`.

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
