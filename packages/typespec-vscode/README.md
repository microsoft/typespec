# TypeSpec in Visual Studio Code

[Repository](https://github.com/microsoft/typespec) | [Documentation](https://typespec.io/docs) | [Issues](https://github.com/microsoft/typespec/issues) | [Samples](https://github.com/microsoft/typespec/tree/main/packages/samples/specs)

Using TypeSpec in Visual Studio Code with the extension enables efficient work. It utilizes the capabilities of VS Code to offer IntelliSense, syntax highlighting, code autocompletion, formatting, live diagnostics, rename refactoring, and go-to definition. The extension also provides a seamless experience for TypeSpec project setup and emitter configuration.

## Quick Start

- Step 1. [Install Node.js](https://nodejs.org/en/download/) and ensure you can run the [npm](https://www.npmjs.com/) command in a command promot: `npm --version`.
- Step 2. Install the TypeSpec Compiler/CLI: `npm install -g @typespec/compiler`. Note: if the TypeSpec Compiler/CLI is not installed earlier, the extension will prompt for installation when needed.
- Step 3. [Install the TypeSpec extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode).
- Step 4. Open or Create a TypeSpec project and start coding!

![vscode_project_scaffolding.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_project_scaffolding.gif)

## Writing TypeSpec

- Auto-complete and intelliSense: Writing TypeSpec with auto-completion, code navigation, syntax highlighting
- Live diagnostic reporting
- Code formating and foldering
- Quick fixes
- Refactorings

![vscode.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode.gif)

## Generating from TypeSpec

> **Note:**
> - To emit dotnet SDKs, ensure to install [dotnet SDK](https://dotnet.microsoft.com/download)
> - To emit Java SDKs, ensure to install [JDK](https://www.oracle.com/java/technologies/downloads/)

- Emitting OpenAPI from TypeSpec
- Emitting server stubs and client codes for different languages: Dotnet, Python, Java, JavaScript/TypeScript

![vscode_tsp_to_openapi3_generation.gif](https://raw.githubusercontent.com/microsoft/typespec/main/website/src/content/docs/docs/images/vscode_tsp_to_openapi3_generation.gif)

## Compile Client SDKs

> **Note:**
> - To compile and test dotnet SDKs, ensure to install [dotnet SDK](https://dotnet.microsoft.com/download)
> - To compile and test Java SDKs, ensure to install [JDK](https://www.oracle.com/java/technologies/downloads/)
> - To execute Python SDKs, ensure to install [Python](https://www.python.org/downloads/)

If you have selected client emitted, you can use the following commands to compile the client project in the client sdk folder.

| **Language** | **Command**                |
| ------------ | -------------------------- |
| C#           | `dotnet build`             |
| Java         | `mvn package`              |
| Python       | N/A                        |
| JS/TS        | `npm install && npm build` |

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
