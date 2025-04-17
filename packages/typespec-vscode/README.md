# TypeSpec Extension in Visual Studio Code

[Repository](https://github.com/microsoft/typespec) | [Documentation](https://typespec.io/docs) | [Issues](https://github.com/microsoft/typespec/issues) | [Samples](https://github.com/microsoft/typespec/tree/main/packages/samples/specs)

The TypeSpec extension for Visual Studio Code enhances the development of TypeSpec by leveraging VS Code's powerful features. It provides:

- IntelliSense and syntax highlighting
- Code autocompletion and formatting
- Live diagnostics and quick fixes
- Refactoring tools (rename, go-to definition, etc.)
- Seamless project setup and emitter configuration <_new_>
- Import TypeSpec from existing OpenAPI 3 definitions <_new_>
- Emit code from TypeSpec <_new_>
- Preview API documentation <_new_>

## Prerequisites

Before using the TypeSpec extension, install [Node.js](https://nodejs.org/en/download/) and verify npm is available:

```sh
npm --version
```

Install the TypeSpec CLI:

```sh
npm install -g @typespec/compiler
```

Other necessary installations will be prompted within the extension as needed.

## Features

### Write TypeSpec

- **IntelliSense & Auto-completion**: Code faster with smart suggestions.
- **Code Formatting & Folding**: Keep your code clean and organized with built-in formatting and folding support.
- **Syntax Highlighting**: Clear and readable TypeSpec syntax.
- **Live Diagnostics**: Get real-time feedback on code issues.
- **Quick Fixes & Refactoring**: Rename, go-to definition, and format with ease.
- **Hover Info**: Get detailed information about TypeSpec elements by hovering over them.

![vscode.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode.gif)

### Create TypeSpec Project

**Create TypeSpec Project**: Easily initialize a new TypeSpec project based on a template, ensuring a structured and ready-to-use setup.

![vscode_project_scaffolding.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_project_scaffolding.gif)

### Emit Code from TypeSpec

The extension allows emitting various outputs from TypeSpec:

- **OpenAPI Specification**
- **Server SDKs**: Emit server stubs for different back-end frameworks.
- **Client SDKs**: Emit client code for multiple languages, including:
  - .NET (C#)
  - Python
  - Java
  - JavaScript/TypeScript

The action appears in the context menu on a tsp file. Or invoke `TypeSpec: Emit From TypeSpec` to emit needed outputs:

![vscode_tsp_to_server_stubs.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_tsp_to_server_stubs.gif)

### Import TypeSpec from OpenAPI 3

The extension supports to import TypeSpec from OpenAPI 3. Invoke `TypeSpec: Import TypeSpec from OpenAPI 3` to begin importing.

<!--![vscode_import_tsp_from_openapi3.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_import_tsp_from_openapi3.gif)-->

### Preview API Documentation

The extension allows to preview API documentation. The action appears in the context menu on a tsp file. Or invoke `TypeSpec: Preview API Documentation` to visualize your API definitions.

<!--![vscode_preview_api_documentation.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_preview_api_documentation.gif)-->

## Commands

The extension provides the following commands:

| **Command**                                        | **Description**                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `TypeSpec: Create TypeSpec Project`                | Scaffold a new TypeSpec project.                                    |
| `TypeSpec: Install TypeSpec Compiler/CLI globally` | Install the TypeSpec Compiler/CLI globally.                         |
| `TypeSpec: Generate From TypeSpec`                 | Compile and generate from TypeSpec files into the specified output. |
| `TypeSpec: Restart TypeSpec Server`                | Restart the TypeSpec language server.                               |
| `TypeSpec: Show Output Channel`                    | Open the TypeSpec output channel to view logs.                      |
| `TypeSpec: Preview API Documentation`              | Preview API documentation generated from TypeSpec in the workspace. |
| `TypeSpec: Import TypeSpec from OpenAPI 3`         | Import TypeSpec from existing OpenAPI 3 definitions                 |

## Configuration

TypeSpec will interpolate a few variables using this pattern `${<name>}`. For example `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Correspond to the root of your Visual Studio workspace.

### `typespec.tsp-server.path`: Configure the server path

There are cases where the TypeSpec project is located in a subfolder. In such cases, the TypeSpec extension is not able to find the tsp compiler automatically and needs a little guidance.
This setting provides the ability to configure where the tsp compiler is located.

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

## Telemetry

The TypeSpec Extension for Visual Studio Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://privacy.microsoft.com/privacystatement) to learn more. This extension respects the `telemetry.telemetryLevel` setting which you can find more information in the [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting) and [Telemetry Data](https://aka.ms/typespec/vscexdata).
