#Requires -Version 7.0

<#
.SYNOPSIS
    Builds local generator packages and regenerates Azure SDK for .NET libraries for validation.

.DESCRIPTION
    This script:
    1. Builds a local npm package of @typespec/http-client-csharp with a versioned name (1.0.0-alpha.YYYYMMDD.hash)
    2. Builds and packages the three NuGet generator framework packages with the same versioning
    3. Updates Packages.Data.props in azure-sdk-for-net with the local NuGet version
    4. Updates the Azure generator (@azure-typespec/http-client-csharp) to use the local unbranded generator
    5. Builds and packages the Azure generator locally
    6. Updates the management plane generator (@azure-typespec/http-client-csharp-mgmt) to use local generators
    7. Updates the eng folder package.json artifacts in azure-sdk-for-net
    8. Regenerates libraries based on specified filters (all, by generator type, or interactively selected)
    9. Restores all modified artifacts to original state on success
    
    Generator Filtering:
    - Use -Azure to regenerate only Azure-branded libraries (@azure-typespec/http-client-csharp)
    - Use -Unbranded to regenerate only unbranded libraries (@typespec/http-client-csharp)
    - Use -Mgmt to regenerate only management plane libraries (@azure-typespec/http-client-csharp-mgmt)
    - Omit all filter parameters to regenerate all libraries (default)
    - Use -Select for interactive selection (can be combined with generator filters)

.PARAMETER AzureSdkForNetRepoPath
    Required. The local file system path to the azure-sdk-for-net repository.

.PARAMETER Select
    Optional. When specified, displays an interactive menu to select specific libraries to regenerate.
    If omitted, regenerates all libraries without prompting.

.PARAMETER Azure
    Optional. When specified, only regenerates libraries using the Azure generator (@azure-typespec/http-client-csharp).
    Mutually exclusive with Unbranded and Mgmt parameters.

.PARAMETER Unbranded
    Optional. When specified, only regenerates libraries using the unbranded generator (@typespec/http-client-csharp).
    Mutually exclusive with All, Azure, and Mgmt parameters.

.PARAMETER Mgmt
    Optional. When specified, only regenerates libraries using the management plane generator (@azure-typespec/http-client-csharp-mgmt).
    Mutually exclusive with Azure and Unbranded parameters.
    If no generator filter is specified, all libraries are regenerated.

.EXAMPLE
    # Windows - Regenerate all libraries
    .\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net"
    
    # Linux/macOS - Regenerate all libraries
    ./RegenPreview.ps1 -AzureSdkForNetRepoPath "/home/user/repos/azure-sdk-for-net"

.EXAMPLE
    # Interactively select libraries to regenerate (from all available)
    .\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Select

.EXAMPLE
    # Regenerate only Azure-branded libraries (non-interactive)
    .\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Azure

.EXAMPLE
    # Interactively select from Azure-branded libraries only
    .\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Azure -Select

.EXAMPLE
    # Regenerate only unbranded libraries
    .\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Unbranded

.EXAMPLE
    # Regenerate only management plane libraries
    .\RegenPreview.ps1 -AzureSdkForNetRepoPath "C:\repos\azure-sdk-for-net" -Mgmt
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$AzureSdkForNetRepoPath,
    
    [Parameter(Mandatory=$false)]
    [switch]$Select,
    
    [Parameter(Mandatory=$false)]
    [switch]$Azure,
    
    [Parameter(Mandatory=$false)]
    [switch]$Unbranded,
    
    [Parameter(Mandatory=$false)]
    [switch]$Mgmt
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Validate mutually exclusive parameters
$generatorFilters = @($Azure, $Unbranded, $Mgmt)
$activeFilters = @($generatorFilters | Where-Object { $_ }).Count

if ($activeFilters -gt 1) {
    Write-Error "Parameters -Azure, -Unbranded, and -Mgmt are mutually exclusive. Please specify only one."
    exit 1
}

# Import utility functions
Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force
Import-Module "$PSScriptRoot\RegenPreview.psm1" -DisableNameChecking -Force

# Resolve paths
$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$azureSdkRepoPath = Resolve-Path $AzureSdkForNetRepoPath -ErrorAction Stop

Write-Host "==================== LOCAL VALIDATION SCRIPT ====================" -ForegroundColor Cyan
Write-Host "Unbranded Generator Path: $packageRoot" -ForegroundColor Gray
Write-Host "Azure SDK Repo Path: $azureSdkRepoPath" -ForegroundColor Gray

# Display active mode
$modeText = if ($Select) {
    "Interactive library selection"
} elseif ($Azure) {
    "Regenerate Azure generator libraries only"
} elseif ($Unbranded) {
    "Regenerate Unbranded generator libraries only"
} elseif ($Mgmt) {
    "Regenerate Management plane generator libraries only"
} else {
    "Regenerate ALL libraries"
}
Write-Host "Mode: $modeText" -ForegroundColor Yellow
Write-Host ""

# Generate version string with timestamp and hash
# Used for both npm and NuGet packages to ensure consistency
function Get-LocalPackageVersion {
    $timestamp = Get-Date -Format "yyyyMMdd"
    $hash = (git -C $packageRoot rev-parse --short HEAD 2>$null) ?? "local"
    return "1.0.0-alpha.$timestamp.$hash"
}

# Run npm pack and return the package file path
function Invoke-NpmPack {
    param(
        [string]$WorkingDirectory,
        [string]$DebugFolder
    )
    
    Write-Host "Running: npm pack" -ForegroundColor Gray
    Push-Location $WorkingDirectory
    try {
        $output = & npm pack 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "npm pack failed with exit code $LASTEXITCODE"
        }
        
        # Get the first line that ends with .tgz (the actual package filename)
        # It may be in format "filename: package-name.tgz" or just "package-name.tgz"
        $packageLine = ($output | Where-Object { $_ -match '\.tgz$' } | Select-Object -First 1).ToString().Trim()
        if ($packageLine -match 'filename:\s*(.+\.tgz)') {
            $packageFile = $Matches[1].Trim()
        } else {
            $packageFile = $packageLine
        }
        
        $packagePath = Join-Path $WorkingDirectory $packageFile
        if (-not (Test-Path $packagePath)) {
            throw "Package file not created: $packagePath"
        }
        
        # Move package to debug folder
        $debugPackagePath = Join-Path $DebugFolder $packageFile
        Move-Item $packagePath $debugPackagePath -Force
        
        return $debugPackagePath
    }
    finally {
        Pop-Location
    }
}

# Update package.json with new version
function Update-PackageJsonVersion {
    param(
        [string]$PackageJsonPath,
        [string]$NewVersion
    )
    
    Write-Host "Updating package version to $NewVersion in $PackageJsonPath" -ForegroundColor Gray
    $packageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json -AsHashtable
    $packageJson.version = $NewVersion
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content $PackageJsonPath -Encoding utf8 -NoNewline
}

# Update package.json dependency
function Update-PackageDependency {
    param(
        [string]$PackageJsonPath,
        [string]$DependencyName,
        [string]$NewVersion,
        [string]$DependencyType = "devDependencies"
    )
    
    Write-Host "Updating $DependencyName to $NewVersion in $PackageJsonPath" -ForegroundColor Gray
    $packageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json -AsHashtable
    
    if ($packageJson.ContainsKey($DependencyType) -and $packageJson[$DependencyType].ContainsKey($DependencyName)) {
        $packageJson[$DependencyType][$DependencyName] = $NewVersion
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $PackageJsonPath -Encoding utf8 -NoNewline
    } else {
        Write-Warning "$DependencyName not found in $DependencyType of $PackageJsonPath"
    }
}

# Update UnbrandedGeneratorVersion in Packages.Data.props
function Update-UnbrandedGeneratorVersion {
    param(
        [string]$PackagesDataPropsPath,
        [string]$NewVersion
    )
    
    Write-Host "Updating UnbrandedGeneratorVersion to $NewVersion in Packages.Data.props" -ForegroundColor Gray
    
    $content = Get-Content $PackagesDataPropsPath -Raw
    
    # Use regex to find and replace the UnbrandedGeneratorVersion property
    $pattern = '(<UnbrandedGeneratorVersion>)([^<]+)(</UnbrandedGeneratorVersion>)'
    
    if ($content -match $pattern) {
        $oldVersion = $Matches[2]
        $newContent = $content -replace $pattern, "<UnbrandedGeneratorVersion>$NewVersion</UnbrandedGeneratorVersion>"
        Set-Content $PackagesDataPropsPath -Value $newContent -Encoding utf8 -NoNewline
        Write-Host "  Updated UnbrandedGeneratorVersion from $oldVersion to $NewVersion" -ForegroundColor Green
    } else {
        throw "UnbrandedGeneratorVersion property not found in $PackagesDataPropsPath"
    }
}

# Parse Library_Inventory.md to get libraries
function Get-LibrariesToRegenerate {
    param([string]$InventoryPath)
    
    $libraries = @()
    $content = Get-Content $InventoryPath -Raw
    
    # Helper function to parse library section
    $parseSection = {
        param($SectionContent, $GeneratorName)
        
        $lines = $SectionContent -split "`n" | Where-Object { 
            $_ -match '^\|.*\|.*\|.*\|' -and 
            $_ -notmatch '^\|\s*Service\s*\|' -and 
            $_ -notmatch '^\|\s*-+\s*\|' -and
            $_.Trim() -ne ''
        }
        
        $result = @()
        foreach ($line in $lines) {
            $parts = $line -split '\|' | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch '^-+$' }
            if ($parts.Count -eq 3 -and $parts[0] -ne 'Service' -and $parts[0] -notmatch '^-+$') {
                $result += @{
                    Service = $parts[0]
                    Library = $parts[1]
                    Path = $parts[2]
                    Generator = $GeneratorName
                }
            }
        }
        return $result
    }
    
    # Parse @azure-typespec/http-client-csharp libraries
    if ($content -match '## Data Plane Libraries using TypeSpec \(@azure-typespec/http-client-csharp\)[\s\S]*?Total: (\d+)([\s\S]*?)(?=##|\z)') {
        $libraries += & $parseSection $Matches[2] "@azure-typespec/http-client-csharp"
    }
    
    # Parse @typespec/http-client-csharp libraries
    if ($content -match '## Data Plane Libraries using TypeSpec \(@typespec/http-client-csharp\)[\s\S]*?Total: (\d+)([\s\S]*?)(?=##|\z)') {
        $libraries += & $parseSection $Matches[2] "@typespec/http-client-csharp"
    }
    
    # Parse @azure-typespec/http-client-csharp-mgmt libraries (management plane)
    if ($content -match '## Management Plane Libraries using TypeSpec \(@azure-typespec/http-client-csharp-mgmt\)[\s\S]*?Total: (\d+)([\s\S]*?)(?=##|\z)') {
        $libraries += & $parseSection $Matches[2] "@azure-typespec/http-client-csharp-mgmt"
    }
    
    return @($libraries)
}

# Interactive library selection
function Select-LibrariesToRegenerate {
    param([array]$Libraries)
    
    # Ensure we have an array
    if (-not $Libraries) {
        return @()
    }
    
    $Libraries = @($Libraries)
    
    Write-Host "`n==================== LIBRARY SELECTION ====================" -ForegroundColor Cyan
    Write-Host "Found $($Libraries.Count) libraries available for regeneration" -ForegroundColor White
    Write-Host ""
    
    # Display libraries grouped by generator
    $azureLibs = @($Libraries | Where-Object { $_.Generator -eq "@azure-typespec/http-client-csharp" })
    $unbrandedLibs = @($Libraries | Where-Object { $_.Generator -eq "@typespec/http-client-csharp" })
    $mgmtLibs = @($Libraries | Where-Object { $_.Generator -eq "@azure-typespec/http-client-csharp-mgmt" })
    
    $currentIndex = 1
    
    if ($azureLibs.Count -gt 0) {
        Write-Host "Azure-branded libraries (@azure-typespec/http-client-csharp):" -ForegroundColor Yellow
        for ($i = 0; $i -lt $azureLibs.Count; $i++) {
            $lib = $azureLibs[$i]
            Write-Host ("  [{0,2}] {1,-50} ({2})" -f $currentIndex, $lib.Library, $lib.Service) -ForegroundColor Gray
            $currentIndex++
        }
        Write-Host ""
    }
    
    if ($unbrandedLibs.Count -gt 0) {
        Write-Host "Unbranded libraries (@typespec/http-client-csharp):" -ForegroundColor Yellow
        for ($i = 0; $i -lt $unbrandedLibs.Count; $i++) {
            $lib = $unbrandedLibs[$i]
            Write-Host ("  [{0,2}] {1,-50} ({2})" -f $currentIndex, $lib.Library, $lib.Service) -ForegroundColor Gray
            $currentIndex++
        }
        Write-Host ""
    }
    
    if ($mgmtLibs.Count -gt 0) {
        Write-Host "Management plane libraries (@azure-typespec/http-client-csharp-mgmt):" -ForegroundColor Yellow
        for ($i = 0; $i -lt $mgmtLibs.Count; $i++) {
            $lib = $mgmtLibs[$i]
            Write-Host ("  [{0,2}] {1,-50} ({2})" -f $currentIndex, $lib.Library, $lib.Service) -ForegroundColor Gray
            $currentIndex++
        }
        Write-Host ""
    }
    
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Enter library numbers to regenerate (comma-separated), 'all' for all libraries, or 'q' to quit:" -ForegroundColor White
    Write-Host "Example: 1,3,5  or  1-4,7  or  all" -ForegroundColor DarkGray
    Write-Host ""
    
    $selection = Read-Host "Selection"
    
    if ($selection -ieq 'q' -or $selection -ieq 'quit') {
        Write-Host "Operation cancelled by user." -ForegroundColor Yellow
        exit 0
    }
    
    if ($selection -ieq 'all') {
        return $Libraries
    }
    
    # Parse selection
    $selectedIndices = @()
    $parts = $selection -split ',' | ForEach-Object { $_.Trim() }
    
    foreach ($part in $parts) {
        if ($part -match '^(\d+)-(\d+)$') {
            # Range: 1-4
            $start = [int]$Matches[1]
            $end = [int]$Matches[2]
            $selectedIndices += ($start..$end)
        }
        elseif ($part -match '^\d+$') {
            # Single number: 3
            $selectedIndices += [int]$part
        }
        else {
            Write-Host "Invalid selection format: $part" -ForegroundColor Red
            exit 1
        }
    }
    
    # Validate and collect selected libraries
    $selectedLibraries = @()
    foreach ($index in $selectedIndices | Sort-Object -Unique) {
        if ($index -lt 1 -or $index -gt $Libraries.Count) {
            Write-Host "Invalid library number: $index (valid range: 1-$($Libraries.Count))" -ForegroundColor Red
            exit 1
        }
        $selectedLibraries += $Libraries[$index - 1]
    }
    
    if ($selectedLibraries.Count -eq 0) {
        Write-Host "No libraries selected. Exiting." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "`nSelected $($selectedLibraries.Count) libraries for regeneration:" -ForegroundColor Green
    foreach ($lib in $selectedLibraries) {
        Write-Host "  - $($lib.Library) ($($lib.Service))" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Ensure we return an array, even for a single element
    return @($selectedLibraries)
}

# Regenerate a single library
function Invoke-LibraryRegeneration {
    param(
        [hashtable]$Library,
        [string]$AzureSdkPath
    )
    
    $libraryPath = Join-Path $AzureSdkPath $Library.Path
    
    if (-not (Test-Path $libraryPath)) {
        return @{
            Success = $false
            Error = "Library path not found: $libraryPath"
            Output = ""
        }
    }
    
    # Check if we need to look in a src subdirectory
    # Some libraries have their project in sdk/<service>/<library>/src
    $srcPath = Join-Path $libraryPath "src"
    $buildPath = $libraryPath
    
    if ((Test-Path $srcPath) -and (Get-ChildItem -Path $srcPath -Filter "*.csproj" -ErrorAction SilentlyContinue)) {
        $buildPath = $srcPath
    }
    
    try {
        # Run generation using dotnet build /t:GenerateCode
        Write-Host "  Running: dotnet build /t:GenerateCode in $buildPath" -ForegroundColor Gray
        
        Push-Location $buildPath
        try {
            $output = & dotnet build /t:GenerateCode 2>&1
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -ne 0) {
                return @{
                    Success = $false
                    Error = "Generation failed with exit code $exitCode"
                    Output = $output -join "`n"
                }
            }
            
            return @{
                Success = $true
                Output = $output -join "`n"
            }
        }
        finally {
            Pop-Location
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            Output = $_.Exception.ToString()
        }
    }
}

# Generate final report
function Write-RegenerationReport {
    param(
        [array]$Results,
        [TimeSpan]$ElapsedTime,
        [string]$DebugFolder
    )
    
    $passed = @($Results | Where-Object { $_.Success -eq $true })
    $failed = @($Results | Where-Object { $_.Success -eq $false })
    
    Write-Host "`n==================== REGENERATION REPORT ====================" -ForegroundColor Cyan
    Write-Host "Total Libraries: $($Results.Count)" -ForegroundColor White
    Write-Host "Passed: $($passed.Count)" -ForegroundColor Green
    Write-Host "Failed: $($failed.Count)" -ForegroundColor Red
    
    if ($ElapsedTime) {
        $elapsedFormatted = "{0:hh\:mm\:ss}" -f $ElapsedTime
        Write-Host "Execution Time: $elapsedFormatted" -ForegroundColor Cyan
    }
    Write-Host ""
    
    if ($passed.Count -gt 0) {
        Write-Host "PASSED LIBRARIES:" -ForegroundColor Green
        foreach ($result in $passed) {
            Write-Host "  ✓ $($result.Library) ($($result.Service))" -ForegroundColor Green
        }
        Write-Host ""
    }
    
    if ($failed.Count -gt 0) {
        Write-Host "FAILED LIBRARIES:" -ForegroundColor Red
        foreach ($result in $failed) {
            Write-Host "  ✗ $($result.Library) ($($result.Service))" -ForegroundColor Red
            Write-Host "    Error: $($result.Error)" -ForegroundColor Gray
            if ($result.Output) {
                Write-Host "    Details: $($result.Output.Substring(0, [Math]::Min(200, $result.Output.Length)))..." -ForegroundColor DarkGray
            }
        }
        Write-Host ""
    }
    
    Write-Host "=============================================================" -ForegroundColor Cyan
    
    # Save detailed report to debug folder
    $reportPath = if ($DebugFolder) { 
        Join-Path $DebugFolder "regen-report.json" 
    } else { 
        Join-Path $packageRoot "regen-report.json" 
    }
    $Results | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding utf8
    Write-Host "Detailed report saved to: $reportPath" -ForegroundColor Gray
}

# ============================================================================
# Main Script Execution
# ============================================================================

# Start timer
$scriptStartTime = Get-Date

try {
    # Step 0: Load and select libraries to regenerate (if using -Select flag)
    if ($Select) {
        Write-Host "`n[0/8] Loading libraries from Library_Inventory.md..." -ForegroundColor Cyan
        
        $inventoryPath = Join-Path $azureSdkRepoPath "doc" "GeneratorMigration" "Library_Inventory.md"
        if (-not (Test-Path $inventoryPath)) {
            throw "Library_Inventory.md not found at: $inventoryPath"
        }
        
        $allLibraries = Get-LibrariesToRegenerate -InventoryPath $inventoryPath
        
        # Apply generator filter before interactive selection
        $filteredLibraries = @(Filter-LibrariesByGenerator `
            -Libraries $allLibraries `
            -Azure:$Azure `
            -Unbranded:$Unbranded `
            -Mgmt:$Mgmt)
        
        if (-not $filteredLibraries -or $filteredLibraries.Count -eq 0) {
            Write-Host "No libraries found matching the specified generator filter" -ForegroundColor Yellow
            exit 0
        }
        
        $libraries = @(Select-LibrariesToRegenerate -Libraries $filteredLibraries)
        
        # Check if user cancelled selection
        if (-not $libraries -or $libraries.Count -eq 0) {
            Write-Host "No libraries selected. Exiting..." -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Create debug folder for packaged artifacts with timestamped subfolder
    $timestamp = Get-Date -Format "yyyyMMdd"
    $debugFolder = Join-Path $packageRoot "debug" $timestamp
    if (-not (Test-Path $debugFolder)) {
        New-Item -ItemType Directory -Path $debugFolder -Force | Out-Null
    }
    
    Write-Host "Debug folder: $debugFolder" -ForegroundColor Gray
    Write-Host ""
    
    # Step 1: Build the unbranded generator
    Write-Host "`n[1/8] Building unbranded generator (@typespec/http-client-csharp)..." -ForegroundColor Cyan
    
    Push-Location $packageRoot
    try {
        Write-Host "Running: npm ci" -ForegroundColor Gray
        Invoke "npm ci"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies for unbranded generator"
        }
        
        Write-Host "Running: npm run clean" -ForegroundColor Gray
        Invoke "npm run clean"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to clean unbranded generator"
        }
        
        Write-Host "Running: npm run build" -ForegroundColor Gray
        Invoke "npm run build"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build unbranded generator"
        }
    }
    finally {
        Pop-Location
    }
    
    # Step 2: Package the unbranded generator with local version
    Write-Host "`n[2/8] Packaging unbranded generator..." -ForegroundColor Cyan
    
    $localVersion = Get-LocalPackageVersion
    Write-Host "Package version: $localVersion (used for all npm and NuGet packages)" -ForegroundColor Yellow
    
    $unbrandedPackageJson = Join-Path $packageRoot "package.json"
    $originalPackageJson = Get-Content $unbrandedPackageJson -Raw
    
    try {
        Update-PackageJsonVersion -PackageJsonPath $unbrandedPackageJson -NewVersion $localVersion
        $unbrandedPackagePath = Invoke-NpmPack -WorkingDirectory $packageRoot -DebugFolder $debugFolder
        Write-Host "Created package: $unbrandedPackagePath" -ForegroundColor Green
    }
    finally {
        # Restore original package.json
        Set-Content $unbrandedPackageJson $originalPackageJson -Encoding utf8 -NoNewline
    }
    
    # Step 2.5: Build and package NuGet packages for generator framework
    Write-Host "`n[2.5/7] Building and packaging NuGet generator packages..." -ForegroundColor Cyan
    
    $generatorRoot = Join-Path $packageRoot "generator"
    $nugetProjects = @(
        "Microsoft.TypeSpec.Generator\src\Microsoft.TypeSpec.Generator.csproj",
        "Microsoft.TypeSpec.Generator.Input\src\Microsoft.TypeSpec.Generator.Input.csproj",
        "Microsoft.TypeSpec.Generator.ClientModel\src\Microsoft.TypeSpec.Generator.ClientModel.csproj"
    )
    
    foreach ($project in $nugetProjects) {
        $projectPath = Join-Path $generatorRoot $project
        if (-not (Test-Path $projectPath)) {
            throw "NuGet project not found: $projectPath"
        }
        
        Write-Host "Packing: $(Split-Path $projectPath -Leaf)" -ForegroundColor Gray
        & dotnet pack $projectPath `
            /p:Version=$localVersion `
            /p:PackageVersion=$localVersion `
            /p:PackageOutputPath=$debugFolder `
            --configuration Debug `
            --no-build `
            --nologo `
            -v:quiet
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to pack $(Split-Path $projectPath -Leaf)"
        }
    }
    
    Write-Host "NuGet packages created" -ForegroundColor Green
    
    # Update Packages.Data.props with local NuGet version
    $packagesDataPropsPath = Join-Path $azureSdkRepoPath "eng" "Packages.Data.props"
    if (-not (Test-Path $packagesDataPropsPath)) {
        throw "Packages.Data.props not found at: $packagesDataPropsPath"
    }
    
    Update-UnbrandedGeneratorVersion -PackagesDataPropsPath $packagesDataPropsPath -NewVersion $localVersion
    
    # Add debug folder as a NuGet package source
    $nugetConfigPath = Join-Path $azureSdkRepoPath "NuGet.Config"
    if (-not (Test-Path $nugetConfigPath)) {
        throw "NuGet.Config not found at: $nugetConfigPath"
    }
    
    Write-Host "Adding debug folder as local NuGet package source..." -ForegroundColor Gray
    [xml]$nugetConfig = Get-Content $nugetConfigPath
    $packageSources = $nugetConfig.configuration.packageSources
    
    # Create local source element
    $localSource = $nugetConfig.CreateElement("add")
    $localSource.SetAttribute("key", "local-codegen-debug-packages")
    $localSource.SetAttribute("value", $debugFolder)
    
    # Find the <clear /> element and insert after it
    $clearElement = $packageSources.ChildNodes | Where-Object { $_.Name -eq "clear" } | Select-Object -First 1
    
    if ($clearElement -and $clearElement.NextSibling) {
        $packageSources.InsertBefore($localSource, $clearElement.NextSibling) | Out-Null
    } elseif ($clearElement) {
        $packageSources.AppendChild($localSource) | Out-Null
    } else {
        # No clear element, insert at the beginning
        if ($packageSources.FirstChild) {
            $packageSources.InsertBefore($localSource, $packageSources.FirstChild) | Out-Null
        } else {
            $packageSources.AppendChild($localSource) | Out-Null
        }
    }
    
    $nugetConfig.Save($nugetConfigPath)
    Write-Host "  Added local NuGet source" -ForegroundColor Green
    
    # Step 3: Update and package Azure generator
    Write-Host "`n[3/8] Updating and packaging Azure generator..." -ForegroundColor Cyan
    
    $azureGeneratorPath = Join-Path $azureSdkRepoPath "eng" "packages" "http-client-csharp"
    $packagesDataPropsPath = Join-Path $azureSdkRepoPath "eng" "Packages.Data.props"
    
    $azurePackagePath = Update-AzureGenerator `
        -AzureGeneratorPath $azureGeneratorPath `
        -UnbrandedPackagePath $unbrandedPackagePath `
        -DebugFolder $debugFolder `
        -PackagesDataPropsPath $packagesDataPropsPath `
        -LocalVersion $localVersion
    
    Write-Host "Created Azure package: $azurePackagePath" -ForegroundColor Green
    
    # Step 4: Update eng folder artifacts in azure-sdk-for-net
    Write-Host "`n[4/8] Updating eng folder artifacts..." -ForegroundColor Cyan
    
    $engFolder = Join-Path $azureSdkRepoPath "eng"
    $tempDir = Join-Path $engFolder "temp-package-update"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Helper function to update emitter package files
    $updateEmitterPackage = {
        param($PackagePath, $EmitterJsonName, $LockJsonName)
        
        $emitterJson = Join-Path $engFolder $EmitterJsonName
        $tempPackageJson = Join-Path $tempDir "package.json"
        
        Copy-Item $emitterJson $tempPackageJson -Force
        
        Push-Location $tempDir
        try {
            & npm install "file:$PackagePath" --package-lock-only 2>&1 | Out-Null
            
            Copy-Item $tempPackageJson $emitterJson -Force
            $lockFile = Join-Path $tempDir "package-lock.json"
            if (Test-Path $lockFile) {
                Copy-Item $lockFile (Join-Path $engFolder $LockJsonName) -Force
            }
            
            # Cleanup temp files
            Remove-Item $tempPackageJson, $lockFile -Force -ErrorAction SilentlyContinue
        }
        finally {
            Pop-Location
        }
    }
    
    try {
        Write-Host "Updating Azure emitter package..." -ForegroundColor Gray
        & $updateEmitterPackage $azurePackagePath "azure-typespec-http-client-csharp-emitter-package.json" "azure-typespec-http-client-csharp-emitter-package-lock.json"
        
        Write-Host "Updating unbranded emitter package..." -ForegroundColor Gray
        & $updateEmitterPackage $unbrandedPackagePath "http-client-csharp-emitter-package.json" "http-client-csharp-emitter-package-lock.json"
        
        Write-Host "Emitter packages updated" -ForegroundColor Green
    }
    finally {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Step 5: Update and build management plane generator
    Write-Host "`n[5/8] Updating management plane generator (@azure-typespec/http-client-csharp-mgmt)..." -ForegroundColor Cyan
    
    $mgmtGeneratorPath = Join-Path $engFolder "packages" "http-client-csharp-mgmt"
    
    if (Test-Path $mgmtGeneratorPath) {
        Update-MgmtGenerator `
            -EngFolder $engFolder `
            -DebugFolder $debugFolder `
            -LocalVersion $localVersion
        
        Write-Host "Management plane generator updated successfully" -ForegroundColor Green
    } else {
        Write-Host "Management plane generator not found, skipping..." -ForegroundColor Yellow
    }
    
    # Step 6: Get or confirm libraries to regenerate
    Write-Host "`n[6/8] Preparing library list for regeneration..." -ForegroundColor Cyan
    
    if (-not $Select) {
        # Load all libraries if not using -Select flag
        $inventoryPath = Join-Path $azureSdkRepoPath "doc" "GeneratorMigration" "Library_Inventory.md"
        if (-not (Test-Path $inventoryPath)) {
            throw "Library_Inventory.md not found at: $inventoryPath"
        }
        
        $allLibraries = Get-LibrariesToRegenerate -InventoryPath $inventoryPath
        
        # Apply generator filter
        $libraries = Filter-LibrariesByGenerator `
            -Libraries $allLibraries `
            -Azure:$Azure `
            -Unbranded:$Unbranded `
            -Mgmt:$Mgmt
        
        if ($libraries.Count -eq 0) {
            Write-Host "No libraries found matching the specified generator filter" -ForegroundColor Yellow
            Write-Host "Skipping regeneration step..." -ForegroundColor Gray
        } else {
            $filterText = if ($Azure) {
                " (Azure generator only)"
            } elseif ($Unbranded) {
                " (Unbranded generator only)"
            } elseif ($Mgmt) {
                " (Management plane generator only)"
            } else {
                ""
            }
            Write-Host "Regenerating $($libraries.Count) libraries$filterText" -ForegroundColor Yellow
        }
    } else {
        # Libraries were already selected at the beginning
        if ($libraries -and $libraries.Count -gt 0) {
            Write-Host "Using $($libraries.Count) previously selected libraries" -ForegroundColor Yellow
        } else {
            Write-Host "No libraries were selected" -ForegroundColor Yellow
        }
    }
    
    # Step 7: Regenerate libraries (in parallel)
    if (-not $libraries -or $libraries.Count -eq 0) {
        Write-Host "`n[7/8] Skipping regeneration (no libraries selected)..." -ForegroundColor Yellow
        $failedCount = 0
    } else {
        Write-Host "`n[7/8] Regenerating libraries..." -ForegroundColor Cyan
        
        # Determine parallel execution throttle limit: (CPU cores - 2), min 1, max 8
        $cpuCores = if ($IsWindows -or $PSVersionTable.PSVersion.Major -lt 6) {
            (Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
        } elseif ($IsMacOS) {
            [int](sysctl -n hw.ncpu)
        } else {
            [int](nproc)
        }
        
        $throttleLimit = [Math]::Max(1, [Math]::Min(8, $cpuCores - 2))
        
        Write-Host "Using $throttleLimit concurrent jobs (detected $cpuCores logical processors)" -ForegroundColor Gray
        Write-Host ""
        
        # Pre-install tsp-client to avoid concurrent npm operations
    Write-Host "Pre-installing tsp-client..." -ForegroundColor Gray
    $tspClientDir = Join-Path $azureSdkRepoPath "eng" "common" "tsp-client"
    & npm ci --prefix $tspClientDir 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install tsp-client"
    }
    Write-Host "  tsp-client ready" -ForegroundColor Green
    Write-Host ""
    
    # Thread-safe collections for progress tracking
    $completed = [System.Collections.Concurrent.ConcurrentBag[int]]::new()
    $totalCount = $libraries.Count
    
    # Run regeneration in parallel
    $results = $libraries | ForEach-Object -ThrottleLimit $throttleLimit -Parallel {
        $library = $_
        $azureSdkPath = $using:azureSdkRepoPath
        $completedBag = $using:completed
        $total = $using:totalCount
        
        # Determine build path (check for src subdirectory)
        $libraryPath = Join-Path $azureSdkPath $library.Path
        $srcPath = Join-Path $libraryPath "src"
        $buildPath = if ((Test-Path $srcPath) -and (Get-ChildItem -Path $srcPath -Filter "*.csproj" -ErrorAction SilentlyContinue)) {
            $srcPath
        } else {
            $libraryPath
        }
        
        # Regenerate library
        $result = try {
            if (-not (Test-Path $libraryPath)) {
                @{ Success = $false; Error = "Library path not found"; Output = "" }
            } else {
                Push-Location $buildPath
                try {
                    $output = & dotnet build /t:GenerateCode /p:SkipTspClientInstall=true 2>&1
                    $exitCode = $LASTEXITCODE
                    
                    if ($exitCode -ne 0) {
                        @{ Success = $false; Error = "Generation failed with exit code $exitCode"; Output = ($output -join "`n") }
                    } else {
                        @{ Success = $true; Output = ($output -join "`n") }
                    }
                }
                finally {
                    Pop-Location
                }
            }
        }
        catch {
            @{ Success = $false; Error = $_.Exception.Message; Output = $_.Exception.ToString() }
        }
        
        # Update progress counter
        $completedBag.Add(1)
        $currentCount = $completedBag.Count
        
        # Thread-safe console output with progress
        $status = if ($result.Success) { "✓" } else { "✗" }
        $color = if ($result.Success) { "Green" } else { "White" }
        
        $progressMsg = "[$currentCount/$total] $status $($library.Library)"
        Write-Host $progressMsg -ForegroundColor $color
        
        # Return result with library metadata
        return @{
            Service = $library.Service
            Library = $library.Library
            Path = $library.Path
            Generator = $library.Generator
            Success = if ($result.ContainsKey('Success')) { $result.Success } else { $false }
            Error = if ($result.ContainsKey('Error')) { $result.Error } else { "" }
            Output = if ($result.ContainsKey('Output')) { $result.Output } else { "" }
        }
    }
    
    # Generate final report
    $scriptEndTime = Get-Date
    $elapsedTime = $scriptEndTime - $scriptStartTime
    
    Write-RegenerationReport -Results $results -ElapsedTime $elapsedTime -DebugFolder $debugFolder
    
    # Check if any libraries failed
    $failedLibraries = @($results | Where-Object { -not $_.Success })
    $failedCount = $failedLibraries.Count
    }
    
    if ($failedCount -gt 0) {
        Write-Host "`nWARNING: $failedCount libraries failed to regenerate" -ForegroundColor Yellow
        Write-Host "Review the report above for details" -ForegroundColor Yellow
    } else {
        Write-Host "`nSUCCESS: All libraries regenerated successfully!" -ForegroundColor Green
        
        # Step 8: Restore artifacts to original state
        Write-Host "`n[8/8] Restoring artifacts to original state..." -ForegroundColor Cyan
        
        Push-Location $azureSdkRepoPath
        try {
            Write-Host "Restoring modified files..." -ForegroundColor Gray
            & git restore `
                eng/azure-typespec-http-client-csharp-emitter-package.json `
                eng/azure-typespec-http-client-csharp-emitter-package-lock.json `
                eng/http-client-csharp-emitter-package.json `
                eng/http-client-csharp-emitter-package-lock.json `
                eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json `
                eng/azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json `
                eng/packages/http-client-csharp/package-lock.json `
                eng/packages/http-client-csharp-mgmt/package.json `
                eng/packages/http-client-csharp-mgmt/package-lock.json `
                eng/Packages.Data.props `
                NuGet.Config 2>&1 | Out-Null
            Write-Host "  All artifacts restored" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }
}
catch {
    Write-Host "`nERROR: Script failed during pre-requisite steps" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    
    # Attempt to restore NuGet.Config even on failure
    Write-Host "`nAttempting to restore NuGet.Config..." -ForegroundColor Yellow
    Push-Location $azureSdkRepoPath -ErrorAction SilentlyContinue
    try {
        & git restore NuGet.Config 2>&1 | Out-Null
        Write-Host "  NuGet.Config restored" -ForegroundColor Green
    }
    catch {
        Write-Host "  Failed to restore NuGet.Config" -ForegroundColor Red
    }
    finally {
        Pop-Location -ErrorAction SilentlyContinue
    }
    
    exit 1
}

Write-Host "`nScript completed." -ForegroundColor Cyan
