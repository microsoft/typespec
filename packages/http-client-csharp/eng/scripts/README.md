# Add Debug Profile Script

This PowerShell script automates the setup for debugging TypeSpec generation for a specific library in the Microsoft TypeSpec Generator (MTG).

## Purpose

When developing with TypeSpec, you often need to debug the generation process for a specific library. This script streamlines the process by:

1. Installing the `@azure-tools/typespec-client-generator-cli` if not already installed
2. Running `tsp-client sync` in the target SDK directory
3. Running `tsp-client generate --save-inputs` to create the `tspCodeModel.json`
4. Adding a new debug profile to `launchSettings.json` that targets the DLL (for easier debugging of MTG code)

## Prerequisites

- PowerShell 7.0 or later
- Node.js and npm

## Usage

### Using npm script (recommended)

```bash
# From the packages/http-client-csharp directory
npm run add-debug-profile -- -SdkDirectory "/path/to/sdk/directory"

# With custom generator
npm run add-debug-profile -- -SdkDirectory "/path/to/sdk/directory" -Generator "StubLibraryGenerator"
```

### Using PowerShell directly

```powershell
# From the packages/http-client-csharp directory
pwsh eng/scripts/Add-Debug-Profile.ps1 -SdkDirectory "/path/to/sdk/directory"

# With custom generator
pwsh eng/scripts/Add-Debug-Profile.ps1 -SdkDirectory "/path/to/sdk/directory" -Generator "StubLibraryGenerator"
```

## Parameters

- `SdkDirectory`: Path to the target SDK service directory (required)
- `Generator`: Generator name (default: `ScmCodeModelGenerator`)

## Examples

```powershell
# Add debug profile for Azure Storage Blobs SDK
pwsh eng/scripts/Add-Debug-Profile.ps1 -SdkDirectory "C:\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs"

# Add debug profile with StubLibraryGenerator for testing
pwsh eng/scripts/Add-Debug-Profile.ps1 -SdkDirectory ".\test-project" -Generator "StubLibraryGenerator"

# Using npm script
npm run add-debug-profile -- -SdkDirectory "/path/to/azure-sdk-for-net/sdk/storage/Azure.Storage.Blobs"
```

## What it does

1. **Checks for tsp-client**: If `@azure-tools/typespec-client-generator-cli` is not installed, it will install it globally
2. **Runs tsp-client commands**: Executes `tsp-client sync` and `tsp-client generate --save-inputs` in the target directory
3. **Updates launchSettings.json**: Adds a new debug profile with:
   - **Executable**: `dotnet`
   - **Arguments**: `$(SolutionDir)/../dist/generator/Microsoft.TypeSpec.Generator.dll [SDK_DIRECTORY] -g [GENERATOR]`
   - **Profile name**: Based on the SDK directory name

## Output

The script creates a new profile in `generator/Microsoft.TypeSpec.Generator/src/Properties/launchSettings.json` that you can use for debugging in:
- Visual Studio
- Visual Studio Code
- Any other IDE that supports .NET launch profiles

## Benefits of using the DLL vs EXE

Using the DLL instead of the EXE allows for easier debugging of the MTG (Microsoft TypeSpec Generator) code since:
- You can step into the generator code more easily
- Breakpoints in MTG code work more reliably
- Better integration with debuggers

## Notes

- The script will show warnings if the tsp-client commands fail (e.g., if the directory is not a proper TypeSpec SDK directory)
- The profile name is automatically generated from the SDK directory name
- If a profile with the same name already exists, it will be overwritten
- The script requires PowerShell 7.0+, Node.js and npm to be available