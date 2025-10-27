# RegenPreview.ps1

## Overview

`RegenPreview.ps1` is a PowerShell script that automates the process of building local generator packages and regenerating Azure SDK for .NET libraries for validation purposes. This script is designed to streamline the workflow for testing changes to the TypeSpec HTTP Client C# generator before submitting a pull request.

## Purpose

When making changes to the TypeSpec HTTP Client C# generator (either the unbranded `@typespec/http-client-csharp` or the Azure-branded `@azure-typespec/http-client-csharp`), you need to validate that these changes work correctly with the Azure SDK for .NET libraries. This script automates the entire validation workflow by:

1. Building local versions of the generator packages
2. Updating the Azure SDK for .NET repository to use these local packages
3. Regenerating all libraries (or selected libraries if `-Select` is specified)
4. Cleaning up all modifications after validation

## Prerequisites

- **PowerShell 7.0 or later** (cross-platform: Windows, Linux, macOS)
- Node.js and npm installed
- .NET SDK installed
- Local clone of the `typespec` repository (unbranded generator)
- Local clone of the `azure-sdk-for-net` repository

## Usage

### Basic Usage (Regenerate All)

**Windows:**

```powershell
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\path\to\azure-sdk-for-net"
```

**Linux/macOS:**

```powershell
./RegenPreview.ps1 -AzureSdkForNetRepoPath "/home/user/repos/azure-sdk-for-net"
```

This will:

- Clean and build the unbranded and Azure generators with local changes
- Regenerate **all** libraries automatically
- Restore all modified metadata files on success (ie. package.json, package-lock.json)

### Parameters

#### `-AzureSdkForNetRepoPath` (Required)

The local file system path to your `azure-sdk-for-net` repository clone.

**Windows Example:**

```powershell
-AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net"
```

**Linux/macOS Example:**

```powershell
-AzureSdkForNetRepoPath "/home/user/repos/azure-sdk-for-net"
```

#### `-Select` (Optional)

When specified, displays an interactive menu to select specific libraries to regenerate. If omitted, all libraries are regenerated automatically.

Can be combined with generator filter parameters (`-Azure`, `-Unbranded`, `-Mgmt`) to interactively select from a filtered subset.

**Example:**

```powershell
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Select
```

#### `-Azure` (Optional)

When specified, only regenerates libraries using the Azure-branded generator (`@azure-typespec/http-client-csharp`).

**Example:**

```powershell
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Azure
```

#### `-Unbranded` (Optional)

When specified, only regenerates libraries using the unbranded generator (`@typespec/http-client-csharp`).

**Example:**

```powershell
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Unbranded
```

#### `-Mgmt` (Optional)

When specified, only regenerates libraries using the management plane generator (`@azure-typespec/http-client-csharp-mgmt`).

**Example:**

```powershell
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Mgmt
```

### Interactive Selection

When running with the `-Select` flag, the script presents an interactive menu listing all available libraries:

```
==================== LIBRARY SELECTION ====================
Found 28 libraries available for regeneration

Azure-branded libraries (@azure-typespec/http-client-csharp):
  [ 1] Azure.AI.VoiceLive                                  (ai)
  [ 2] Azure.Data.AppConfiguration                         (appconfiguration)
  ...

Unbranded libraries (@typespec/http-client-csharp):
  [12] Azure.AI.Projects                                   (ai)
  [13] Azure.AI.OpenAI                                     (openai)

Management plane libraries (@azure-typespec/http-client-csharp-mgmt):
  [14] Azure.ResourceManager.AgriculturePlatform           (agricultureplatform)
  [15] Azure.ResourceManager.ArizeAIObservabilityEval      (arizeaiobservabilityeval)
  ...

Enter library numbers to regenerate (comma-separated), 'all' for all libraries, or 'q' to quit:
Example: 1,3,5  or  1-4,7  or  all
```

**Selection Options:**

- Single library: `1`
- Multiple libraries: `1,3,5`
- Range of libraries: `1-4`
- Combination: `1-4,7,10`
- All libraries: `all`
- Quit: `q`

## How It Works

The script performs the following steps in sequence:

### Step 0: Library Selection (Interactive Mode Only)

- Parses `Library_Inventory.md` in the azure-sdk-for-net repository
- Applies any generator filters if specified (`-Azure`, `-Unbranded`, `-Mgmt`)
- Displays available libraries grouped by generator type
- Prompts user to select which libraries to regenerate
- Skipped when `-Select` is not specified (non-interactive mode)

### Step 1: Build Unbranded Generator

- Runs `npm ci` to install dependencies
- Runs `npm run clean` to ensure a clean build
- Runs `npm run build` to build `@typespec/http-client-csharp`

### Step 2: Package Unbranded Generator

- Generates a local version string: `1.0.0-alpha.YYYYMMDD.hash`
- Updates `package.json` with the local version
- Runs `npm pack` to create a `.tgz` package
- Moves the package to the `debug` folder
- Restores original `package.json`

### Step 2.5: Build and Package NuGet Packages

- Generates NuGet packages for three generator framework projects:
  - `Microsoft.TypeSpec.Generator`
  - `Microsoft.TypeSpec.Generator.Input`
  - `Microsoft.TypeSpec.Generator.ClientModel`
- Uses Debug configuration with `--no-build` (reuses binaries from Step 1)
- Outputs `.nupkg` files to the `debug` folder
- Updates `Packages.Data.props` in azure-sdk-for-net with the local version
- Adds the `debug` folder as a local NuGet package source in `NuGet.Config`

### Step 3: Update and Build Azure Generator

- Updates the Azure generator's `package.json` to reference the local unbranded package using `file:` protocol
- Runs `npm run clean` to clear previous builds
- Runs `npm install --package-lock-only` to update the lock file with the new local dependency
- Runs `npm ci` for clean installation based on the updated lock file
- Builds the Azure generator with `npm run build`

### Step 4: Package Azure Generator

- Updates `package.json` with the local version (dependency already set in Step 3)
- Runs `npm pack` to create a `.tgz` package
- Moves the package to the `debug` folder
- Restores original `package.json` (after both Steps 3 and 4 complete)

### Step 5: Update eng Folder Artifacts

- Updates package.json artifacts in `azure-sdk-for-net/eng`:
  - `azure-typespec-http-client-csharp-emitter-package.json`
  - `azure-typespec-http-client-csharp-emitter-package-lock.json`
  - `http-client-csharp-emitter-package.json`
  - `http-client-csharp-emitter-package-lock.json`
- Uses a temporary directory to safely update the lock files
- These files control which generator versions are used during library regeneration

### Step 6: Update and Build Management Plane Generator

- Updates the management plane generator (`@azure-typespec/http-client-csharp-mgmt`) located in `azure-sdk-for-net/eng/packages/http-client-csharp-mgmt`
- Updates `package.json` to reference both:
  - Local Azure generator (`@azure-typespec/http-client-csharp`) using `file:` protocol
  - Local unbranded generator (`@typespec/http-client-csharp`) using `file:` protocol
- Runs `npm install` to install dependencies
- Runs `npm run clean` to ensure a clean build
- Runs `npm run build` to build the management plane generator
- Creates a local package with `npm pack`
- Updates eng folder emitter package artifacts:
  - `azure-typespec-http-client-csharp-mgmt-emitter-package.json`
  - `azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json`
- Updates `Packages.Data.props` in azure-sdk-for-net with `AzureGeneratorVersion` property
  - This version is used by management plane libraries that reference the `Azure.Generator` NuGet package
- This step is skipped if the management plane generator directory doesn't exist

### Step 7: Prepare Library List

- Confirms the list of libraries to regenerate
- When no `-Select` flag, loads all libraries from `Library_Inventory.md` including:
  - Data plane libraries using `@azure-typespec/http-client-csharp`
  - Data plane libraries using `@typespec/http-client-csharp`
  - Management plane libraries using `@azure-typespec/http-client-csharp-mgmt`
- In interactive mode (`-Select`), uses the previously selected libraries

### Step 8: Regenerate Libraries

- **Pre-Install tsp-client**: Runs `npm ci --prefix eng\common\tsp-client` once before parallel execution
  - Installs shared TypeSpec compiler tooling used by all libraries
  - Eliminates concurrent npm conflicts during parallel regeneration
- **Parallel Execution**: Uses PowerShell's `ForEach-Object -Parallel` to regenerate multiple libraries concurrently
- **Cross-Platform CPU Detection**:
  - Windows: Uses `Get-CimInstance` with `Win32_Processor`
  - Linux: Uses `nproc` command
  - macOS: Uses `sysctl -n hw.ncpu` command
- **Throttle Limit**: Automatically calculated as `(CPU cores - 2)` with a minimum of 1 and maximum of 8
- **Skip Redundant Installs**: Each parallel job uses `/p:SkipTspClientInstall=true` to skip re-installing tsp-client
- **Thread-Safe Progress**: Real-time updates showing `[completed/total] ✓/✗ LibraryName`
  - Success: Green with ✓
  - Failure: White with ✗ (red reserved for error details in final report)
- **Isolated Execution**: Each library regenerates in its own directory (no conflicts)
- Runs `dotnet build /t:GenerateCode /p:SkipTspClientInstall=true` in the library's project directory
- Automatically detects if the `.csproj` is in a `src` subdirectory
- Tracks success/failure for each library with colored output

### Step 9: Restore Artifacts (On Success Only)

If all libraries regenerate successfully, the script restores modified files:

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

**Note:** If any libraries fail, artifacts are NOT restored, allowing you to debug the issue with the modified configuration intact.

### Error Handling

If the script encounters an error during pre-requisite steps (Steps 1-6), it will:

- Display the error message and stack trace
- Attempt to restore `NuGet.Config` to prevent leaving the repository in an inconsistent state
- Exit with code 1

## Output

### Debug Folder

All packaged artifacts are stored in the `debug` folder at the root of the unbranded generator:

- `typespec-http-client-csharp-{version}.tgz` - Unbranded generator npm package
- `azure-typespec-http-client-csharp-{version}.tgz` - Azure generator npm package
- `Microsoft.TypeSpec.Generator.{version}.nupkg` - Core generator NuGet package
- `Microsoft.TypeSpec.Generator.Input.{version}.nupkg` - Input models NuGet package
- `Microsoft.TypeSpec.Generator.ClientModel.{version}.nupkg` - Client model NuGet package
- `regen-report.json` - Detailed JSON report of regeneration results

### Console Output

The script provides colored console output with:

- **Cyan**: Step headers and section dividers
- **Yellow**: Important information (versions, library counts, warnings)
- **Gray**: Detailed command execution and file operations
- **Green**: Success messages
- **Red**: Error messages and failed libraries
- **White**: Library names during regeneration

### Regeneration Report

After regeneration completes, a summary report is displayed:

```
==================== REGENERATION REPORT ====================
Total Libraries: 3
Passed: 2
Failed: 1
Execution Time: 00:02:45

PASSED LIBRARIES:
  ✓ Azure.AI.VoiceLive (ai)
  ✓ Azure.AI.Projects (cognitiveservices)

FAILED LIBRARIES:
  ✗ Azure.Messaging.EventGrid.Namespaces (eventgrid)
    Error: Generation failed with exit code 1
    Details: ...

=============================================================
Detailed report saved to: C:\...\debug\regen-report.json
```

## Versioning

All packages (both npm and NuGet) use the same version format:

```
1.0.0-alpha.YYYYMMDD.hash
```

Where:

- `YYYYMMDD` is the current date
- `hash` is the short Git commit hash from the unbranded generator repository

**Example:** `1.0.0-alpha.20251024.ce1500756`

This ensures consistency across all packaged artifacts and makes it easy to identify which commit the packages were built from.

## Architecture

### Module Structure

The script uses a modular architecture with PowerShell modules for reusability:

#### `RegenPreview.psm1`

Contains helper functions specific to the RegenPreview workflow:

- **`Update-GeneratorPackage`**: Shared helper function for generator setup
  - Updates `package.json` with specified dependencies
  - Runs `npm install` and `npm run build`
  - Packages the generator with `npm pack`
  - Updates `Packages.Data.props` with version properties
  - Used by both Azure and management plane generator update functions

- **`Update-AzureGenerator`**: Handles the Azure-branded data plane generator setup
  - Calls `Update-GeneratorPackage` with Azure-specific configuration
  - Updates `UnbrandedGeneratorVersion` in `Packages.Data.props`

- **`Update-MgmtGenerator`**: Handles the management plane generator setup
  - Calls `Update-GeneratorPackage` with management plane configuration
  - Updates `AzureGeneratorVersion` in `Packages.Data.props`

- **`Filter-LibrariesByGenerator`**: Filters library list by generator type
  - Accepts `-Azure`, `-Unbranded`, or `-Mgmt` parameters
  - If no filter is specified, returns all libraries (default behavior)
  - Returns libraries matching the specified generator
  - Always returns proper array type to avoid null reference errors

This modular approach keeps the main script focused on orchestration while encapsulating complex operations in reusable functions. The shared `Update-GeneratorPackage` helper eliminates code duplication between generator update functions.

### Library Discovery

Libraries are discovered by parsing `Library_Inventory.md` in the azure-sdk-for-net repository. The script looks for three sections:

1. **Data Plane Libraries using TypeSpec (@azure-typespec/http-client-csharp)**
2. **Data Plane Libraries using TypeSpec (@typespec/http-client-csharp)**
3. **Management Plane Libraries using TypeSpec (@azure-typespec/http-client-csharp-mgmt)**

Each section provides library names, service directories, and paths needed for regeneration.

### Library Filtering

The script includes a `Filter-LibrariesByGenerator` function in `RegenPreview.psm1` that filters the library list based on the generator type specified via command-line parameters.

**How it works:**

1. Libraries are loaded from `Library_Inventory.md` with their `Generator` property
2. The filter function checks if `-Azure`, `-Unbranded`, or `-Mgmt` parameter is specified
3. If no filter parameter is provided, all libraries are returned (default behavior)
4. If a filter is specified, returns only libraries matching that generator type


## Common Scenarios

### Scenario: Test a Small Change Quickly

```powershell
# You want to test Azure generator changes on specific libraries only
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Select

# Select just one or two libraries when prompted
# Selection: 1,5
```

### Scenario: Full Validation Before PR

```powershell
.\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net"
```

