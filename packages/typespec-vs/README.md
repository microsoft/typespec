# TypeSpec Language Support for Visual Studio

[Repository](https://github.com/microsoft/typespec) | [Documentation](https://typespec.io/docs) | [Issues](https://github.com/microsoft/typespec/issues) | [Samples](https://github.com/microsoft/typespec/tree/main/packages/samples/specs)

This provides [TypeSpec](https://github.com/microsoft/typespec) language support for Visual Studio.

## Migration preview

This preview moves the extension to [VisualStudio.Extensibility](https://github.com/microsoft/VSExtensibility), running out of process on .NET 8. It requires **Visual Studio 2022 17.14 or newer**, including Visual Studio 2026. It retains the existing Marketplace extension identity.

The language-server provider API is still a preview API. This migration is not yet at feature parity with the in-process extension:

- Language-server document associations cover `.tsp` and `.cadl` files only. The old filename-specific `tspconfig.yaml` association is not migrated, so TypeSpec-specific language features for that YAML file are not available in this preview.
- The old explicit watched-file patterns and `typespec` configuration-section registration have no equivalents in the current provider API and are not migrated. External changes to closed files and client configuration updates need further integration work.
- Server-path settings are read from `.vs/VSWorkspaceSettings.json` in the open folder or solution directory, without the old workspace settings aggregation.

Windows VSIX installation, language features, syntax highlighting, file icons, restart/shutdown, and VS 2026 compatibility still need manual verification. The modern SDK continues to depend transitively on MessagePack 2.x; this migration retains the security-patched override.

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

1. Create a file `.vs/VSWorkspaceSettings.json` in the open folder or the directory containing the solution.
2. Add configuration as key value pair in this file. Example:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/my-nested-project/node_modules/@typespec/compiler"
}
```

The `${workspaceFolder}` variable expands to the open folder or the directory containing the solution. Relative server paths are resolved from that same directory.

## Building the preview

Build the extension and its workspace dependencies with:

```bash
pnpm --filter "typespec-vs..." build
pnpm --filter typespec-vs test
```

The build produces `Microsoft.TypeSpec.VS.vsix` on Windows using Visual Studio MSBuild. On other platforms, it compiles the extension and generates its out-of-process contribution metadata, but skips VSIX packaging.

Install the VSIX into a Visual Studio experimental instance for evaluation. Check both Open Folder and solution-based projects, local and global compiler discovery, a configured server path containing spaces, and failure reporting when Node.js or the server is unavailable.
