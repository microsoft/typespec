---
title: VS Code Extension
---

## Installation

Install the extension via the Visual Studio Code extension manager [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode)

## Features

The TypeSpec extension for Visual Studio Code enhances the development of TypeSpec by leveraging VS Code's powerful features. It provides:

- IntelliSense and syntax highlighting
- Code autocompletion and formatting
- Live diagnostics and quick fixes
- Refactoring tools (rename, go-to definition, etc.)
- Seamless project setup and emitter configuration <_new_>
- Import TypeSpec from existing OpenAPI 3 definitions <_new_>
- Emit code from TypeSpec <_new_>
- Preview API documentation <_new_>

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

TypeSpec will interpolate a few variables using this pattern: `${<name>}`. For example: `${workspaceFolder}`.

Available variables:

- `workspaceFolder`: Corresponds to the root of your Visual Studio workspace.

### `typespec.tsp-server.path`: Configure the server path

There are cases where the TypeSpec project is located in a subfolder. In such cases, the TypeSpec extension is not able to find the tsp compiler automatically and needs a little guidance.
This setting allows you to configure where the tsp compiler is located:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

## Uninstall

You can uninstall the extension via the Visual Studio Code extension manager or through the command line:

```bash
tsp code uninstall

# For VS Code insiders
tsp code uninstall --insiders
```

## Telemetry

The extension for Visual Studio Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://privacy.microsoft.com/privacystatement) to learn more. This extension respects the `telemetry.telemetryLevel` setting which you can find more information in the [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

### What telemetry data are collected

- OperationTelemetry

| Telemetry name | Type     | Example                            |
| -------------- | -------- | ---------------------------------- |
| EventName      | string   | "start-extension" for example      |
| ActivityId     | string   |                                    |
| StartTime      | datatime |                                    |
| EndTime        | datatime |                                    |
| Result         | string   | "success","fail","cancelled", etc. |
| LastStep       | string   |                                    |

- OperationDetailTelemetry

| Telemetry name   | Type   | Example                                                                                                                      |
| ---------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| ActivityId       | string |                                                                                                                              |
| EmitterName      | string | The extension will log only names of pre-defined emitters. Unknown emitters from customers will be masked to ensure privacy. |
| EmitterVersion   | string |                                                                                                                              |
| CompilerVersion  | string |                                                                                                                              |
| CompilerLocation | string | "global-compiler", "local-compiler", etc. It is not to store the actual path of compiler being installed.                    |
| Error            | string | tsp compiling errors                                                                                                         |
