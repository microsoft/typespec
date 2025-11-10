# Add-Debug-Profile.ps1

## Overview

`Add-Debug-Profile.ps1` is a PowerShell script that creates a debug profile for Visual Studio using locally built TypeSpec emitters. This ensures that when you debug TypeSpec code generation, you're using your local changes rather than published package versions.

## Purpose

When debugging the TypeSpec HTTP Client C# generator, you need to ensure that:
1. Your local emitter changes are reflected in the generated tspCodeModel
2. The debug profile points to the correct generator DLL
3. The setup can be easily cleaned up after debugging

This script automates the entire workflow by following the same approach as `RegenPreview.ps1`:
- Building local emitter packages
- Updating SDK artifacts to use local builds
- Running code generation with local emitters
- Creating a debug profile in launchSettings.json
- Restoring all modified artifacts after completion

## Prerequisites

- **PowerShell 7.0 or later** (cross-platform: Windows, Linux, macOS)
- Node.js and npm installed
- .NET SDK installed
- Local clone of the `typespec` repository (http-client-csharp package)
- Local clone of either:
  - `azure-sdk-for-net` repository (for Azure SDK scenarios)
  - `openai-dotnet` repository (for OpenAI scenarios)

## Usage

### Azure SDK Scenario

```powershell
.\Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs"
```

This will:
1. Detect the emitter type from `tsp-location.yaml` in the SDK directory
2. Build the required local emitters (unbranded, Azure, or Management)
3. Update azure-sdk-for-net artifacts to reference local builds
4. Run code generation to create `tspCodeModel.json`
5. Add a debug profile to `launchSettings.json`
6. Restore all modified artifacts using `git restore`

### OpenAI Scenario

```powershell
.\Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\openai-dotnet"
```

This will:
1. Detect OpenAI mode automatically (path contains "openai-dotnet")
2. Build the local unbranded emitter
3. Update OpenAI codegen configuration
4. Run code generation
5. Add a debug profile for the OpenAI generator
6. Restore all modified artifacts

## Parameters

### `-SdkDirectory` (Required)

The path to the SDK service directory (for Azure SDK) or repository root (for OpenAI).

**Examples:**
- Azure SDK: `C:\repos\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs`
- OpenAI: `C:\repos\openai-dotnet`

The script automatically detects the mode based on the path.

## How It Works

### Detection and Setup

1. **Mode Detection**: Automatically detects if this is an OpenAI scenario (path contains "openai-dotnet")
2. **Emitter Detection**: For Azure SDK, reads `tsp-location.yaml` to determine which emitter is needed:
   - `@typespec/http-client-csharp` (unbranded)
   - `@azure-typespec/http-client-csharp` (Azure branded)
   - `@azure-typespec/http-client-csharp-mgmt` (Management plane)

### Build Process (5 Steps)

#### Step 1: Build Local Unbranded Emitter
- Runs `npm ci` to install dependencies
- Runs `npm run clean` to ensure clean build
- Runs `npm run build` to build the emitter
- Packages the emitter with local version (1.0.0-alpha.YYYYMMDD.hash)
- Stores package in debug folder

#### Step 2: Build NuGet Generator Packages
- Builds three NuGet packages:
  - Microsoft.TypeSpec.Generator
  - Microsoft.TypeSpec.Generator.Input
  - Microsoft.TypeSpec.Generator.ClientModel
- Uses the same local version as npm packages
- Stores packages in debug folder

#### Step 3: Update Artifacts and Build Required Generators
**For Azure SDK:**
- Updates `Packages.Data.props` with local NuGet version
- Adds debug folder as local NuGet source in `NuGet.Config`
- Updates `eng/http-client-csharp-emitter-package.json` and lock file
- If Azure emitter needed:
  - Builds local Azure generator package
  - Updates `eng/azure-typespec-http-client-csharp-emitter-package.json` and lock file
- If Management emitter needed:
  - Builds local Management generator package
  - Updates management emitter artifacts

**For OpenAI:**
- Updates `nuget.config` with local NuGet source
- Updates `codegen/package.json` with local emitter
- Updates `OpenAI.Library.Plugin.csproj` with local NuGet version

#### Step 4: Run Code Generation
- **Azure SDK**: Runs `dotnet build /t:GenerateCode` in the SDK directory
- **OpenAI**: Runs `scripts/Invoke-CodeGen.ps1 -Clean`
- This creates/updates `tspCodeModel.json` using local emitters

#### Step 5: Add Debug Profile
- Reads `launchSettings.json` from the generator project
- Creates/updates a profile named after the SDK directory
- Sets up profile to run `dotnet` with:
  - Path to generator DLL in `TempTypeSpecFiles/node_modules` (Azure) or `codegen/dist` (OpenAI)
  - Path to SDK directory
  - Generator name (ScmCodeModelGenerator, AzureClientGenerator, ManagementClientGenerator, or OpenAILibraryGenerator)

### Cleanup

After successful completion, the script automatically restores all modified artifacts using `git restore`:

**Azure SDK:**
- `eng/azure-typespec-http-client-csharp-emitter-package.json`
- `eng/azure-typespec-http-client-csharp-emitter-package-lock.json`
- `eng/http-client-csharp-emitter-package.json`
- `eng/http-client-csharp-emitter-package-lock.json`
- `eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json`
- `eng/azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json`
- `eng/packages/http-client-csharp/package-lock.json`
- `eng/packages/http-client-csharp-mgmt/package.json`
- `eng/packages/http-client-csharp-mgmt/package-lock.json`
- `eng/Packages.Data.props`
- `NuGet.Config`

**OpenAI:**
- `codegen/package.json`
- `codegen/package-lock.json`
- `nuget.config`
- `codegen/generator/src/OpenAI.Library.Plugin.csproj`

## Output

### Console Output

The script provides colored console output:
- **Cyan**: Step headers and section dividers
- **Yellow**: Important information (mode, versions, emitter type)
- **Gray**: Detailed operations
- **Green**: Success messages
- **Red**: Error messages

### Debug Folder

All packaged artifacts are stored in `debug/{timestamp}` in the http-client-csharp package root:
- `typespec-http-client-csharp-{version}.tgz` - Unbranded npm package
- `azure-typespec-http-client-csharp-{version}.tgz` - Azure npm package (if built)
- `azure-typespec-http-client-csharp-mgmt-{version}.tgz` - Management npm package (if built)
- `Microsoft.TypeSpec.Generator.{version}.nupkg` - Core generator NuGet
- `Microsoft.TypeSpec.Generator.Input.{version}.nupkg` - Input models NuGet
- `Microsoft.TypeSpec.Generator.ClientModel.{version}.nupkg` - Client model NuGet

### Debug Profile

The script adds/updates a profile in `launchSettings.json` that you can select in Visual Studio:

**Example profile:**
```json
{
  "Azure-Storage-Blobs": {
    "commandName": "Executable",
    "executablePath": "dotnet",
    "commandLineArgs": "\"C:/path/to/azure-sdk-for-net/sdk/storage/Azure.Storage.Blobs/TempTypeSpecFiles/node_modules/@azure-typespec/http-client-csharp/dist/generator/Microsoft.TypeSpec.Generator.dll\" \"C:/path/to/azure-sdk-for-net/sdk/storage/Azure.Storage.Blobs\" -g AzureClientGenerator"
  }
}
```

## Comparison with Previous Version

### Before (using tsp-client)

The previous version of `Add-Debug-Profile.ps1`:
- ✗ Used `tsp-client` which referenced published emitter versions from `tsp-location.yaml`
- ✗ Local changes to emitters were **not** reflected in tspCodeModel
- ✗ Required manual cleanup of artifacts
- ✗ Installed `tsp-client` globally
- ✓ Simple and fast

### After (using local builds)

The updated version:
- ✓ Builds local emitters, ensuring **all local changes** are reflected
- ✓ Uses same approach as `RegenPreview.ps1` for consistency
- ✓ Automatically restores artifacts after completion
- ✓ No global tool installations required
- ✓ Supports all emitter types (unbranded, Azure, Management)
- ✗ Slower due to full build process

## Debugging with Visual Studio

After running the script:

1. Open the http-client-csharp solution in Visual Studio
2. Select the profile created by the script (named after your SDK directory)
3. Set breakpoints in the generator code
4. Press F5 to start debugging

The debugger will:
- Run the generator against your SDK directory
- Use the locally built emitters with your changes
- Stop at your breakpoints
- Allow you to inspect and step through code generation

## Troubleshooting

### "Could not determine emitter type from tsp-location.yaml"

**Cause**: The SDK directory doesn't have a `tsp-location.yaml` file or the file doesn't specify an emitter.

**Solution**: Ensure you're pointing to a valid TypeSpec-based SDK directory with a `tsp-location.yaml` file.

### "Could not find azure-sdk-for-net repository root"

**Cause**: The script couldn't find the `eng/Packages.Data.props` file by traversing up from the SDK directory.

**Solution**: Ensure the SDK directory is actually inside an azure-sdk-for-net repository clone.

### Build Failures

**Cause**: Dependencies not installed or build errors in the emitter code.

**Solution**:
1. Ensure you can build the http-client-csharp package manually: `npm ci && npm run build`
2. Fix any build errors before running the script

### Code Generation Failures

**Cause**: Issues with the TypeSpec source or emitter bugs.

**Solution**:
1. Check the console output for specific errors
2. The script will still create the debug profile even if generation has warnings
3. Artifacts are NOT restored on failure, allowing you to debug the issue

## Related Scripts

- **RegenPreview.ps1**: Regenerates multiple SDK libraries with local emitters. Use this for validation before submitting PRs.
- **Generate.ps1**: Standard generation script used in the repository.

## Examples

### Example 1: Debug Azure Storage Blob SDK

```powershell
cd C:\repos\typespec\packages\http-client-csharp\eng\scripts
.\Add-Debug-Profile.ps1 -SdkDirectory "C:\repos\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs"
```

Output:
```
==================== ADD DEBUG PROFILE ====================

Mode: Azure SDK

Debug folder: C:\repos\typespec\packages\http-client-csharp\debug\20250127
Local package version: 1.0.0-alpha.20250127.abc123

[1/5] Building local unbranded emitter...
  Build completed
  Created: typespec-http-client-csharp-1.0.0-alpha.20250127.abc123.tgz

[2/5] Building NuGet generator packages...
  NuGet packages created

[3/5] Updating artifacts and building generators...
  Updated UnbrandedGeneratorVersion to 1.0.0-alpha.20250127.abc123
Building Azure generator...
  Azure generator completed

[4/5] Running code generation...
  Code generation completed

[5/5] Adding debug profile...
Added debug profile 'Azure-Storage-Blobs' to launchSettings.json
Profile configuration:
  - Executable: dotnet
  - Arguments: "C:\repos\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs\TempTypeSpecFiles\node_modules\@azure-typespec\http-client-csharp\dist\generator\Microsoft.TypeSpec.Generator.dll" "C:\repos\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs" -g AzureClientGenerator
  - Generator: AzureClientGenerator
  - Package: http-client-csharp
  - Emitter: @azure-typespec/http-client-csharp (from tsp-location.yaml)

Restoring modified artifacts...
  All artifacts restored

=============================================================
Setup completed successfully!
You can now debug the 'Azure-Storage-Blobs' profile in Visual Studio or VS Code.
```

### Example 2: Debug OpenAI Library

```powershell
.\Add-Debug-Profile.ps1 -SdkDirectory "C:\repos\openai-dotnet"
```

The script automatically detects OpenAI mode and handles the OpenAI-specific workflow.

## Notes

- The script does **not** modify your source code, only artifacts used for generation
- All modifications are automatically restored after completion
- The debug profile remains in `launchSettings.json` for future debugging sessions
- You can run the script multiple times to update the profile
- Each run creates a new timestamp folder in the debug directory
