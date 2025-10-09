#Requires -Version 7.0

<#
.SYNOPSIS
    Script to add launch settings profile for easy debugging of TypeSpec generation

.DESCRIPTION
    This script:
    1. Installs tsp-client if not already installed
    2. Runs tsp-client sync in the target SDK directory
    3. Runs tsp-client generate --save-inputs to create tspCodeModel.json
    4. Reads the emitter configuration from tsp-location.yaml to determine the generator
    5. Adds a new debug profile to launchSettings.json that targets the DLL
    
    The script automatically detects which emitter/generator to use by:
    - First checking tsp-location.yaml for the configured emitter package
    - Falling back to auto-detection based on SDK path if tsp-location.yaml is not found
      (e.g., paths containing "ResourceManager" use ManagementClientGenerator)

.PARAMETER SdkDirectory
    Path to the target SDK service directory

.EXAMPLE
    .\Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs"

.EXAMPLE
    .\Add-Debug-Profile.ps1 -SdkDirectory ".\local-sdk-dir"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SdkDirectory
)

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

# Helper function to run commands and get output
function Invoke-Command-Safe {
    param(
        [string]$Command,
        [string]$WorkingDirectory = $null
    )
    
    try {
        $originalLocation = Get-Location
        if ($WorkingDirectory) {
            Set-Location $WorkingDirectory
        }
        
        $result = Invoke-Expression $Command 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE : $result"
        }
        return $result
    }
    catch {
        throw "Command failed: $Command `n$($_.Exception.Message)"
    }
    finally {
        if ($WorkingDirectory) {
            Set-Location $originalLocation
        }
    }
}

# Helper function to check if a command exists
function Test-CommandExists {
    param([string]$Command)
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check if tsp-client is installed
function Test-TspClientInstalled {
    try {
        Invoke-Command-Safe "tsp-client --version" | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Install tsp-client globally
function Install-TspClient {
    Write-Host "Installing @azure-tools/typespec-client-generator-cli..." -ForegroundColor Yellow
    Invoke-Command-Safe "npm install -g @azure-tools/typespec-client-generator-cli"
    Write-Host "tsp-client installed successfully." -ForegroundColor Green
}

# Run tsp-client commands in the target directory
function Invoke-TspClientCommands {
    param([string]$SdkPath)
    
    Write-Host "Running tsp-client commands in $SdkPath..." -ForegroundColor Cyan
    
    try {
        Write-Host "Running tsp-client sync..." -ForegroundColor Yellow
        try {
            Invoke-Command-Safe "tsp-client sync" -WorkingDirectory $SdkPath
        }
        catch {
            Write-Warning "tsp-client sync failed. This might be expected if the directory is not a proper TypeSpec SDK directory."
            Write-Warning "Error: $($_.Exception.Message)"
        }
        
        Write-Host "Running tsp-client generate --save-inputs..." -ForegroundColor Yellow
        try {
            Invoke-Command-Safe "tsp-client generate --save-inputs" -WorkingDirectory $SdkPath
        }
        catch {
            Write-Warning "tsp-client generate failed. This might be expected if the directory is not a proper TypeSpec SDK directory."
            Write-Warning "Error: $($_.Exception.Message)"
        }
        
        Write-Host "tsp-client commands completed." -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to run tsp-client commands: $($_.Exception.Message)"
        throw
    }
}

# Get the path to launchSettings.json
function Get-LaunchSettingsPath {
    $packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
    return Join-Path $packageRoot 'generator' 'Microsoft.TypeSpec.Generator' 'src' 'Properties' 'launchSettings.json'
}

# Read and parse launchSettings.json
function Get-LaunchSettings {
    $launchSettingsPath = Get-LaunchSettingsPath
    $content = Get-Content $launchSettingsPath -Raw
    return $content | ConvertFrom-Json
}

# Generate a profile name from the SDK directory
function Get-ProfileName {
    param([string]$SdkPath)
    
    $dirName = Split-Path $SdkPath -Leaf
    # Replace invalid characters and make it a valid profile name
    return $dirName -replace '[^a-zA-Z0-9\-_.]', '-'
}

# Determine if management mode should be used based on SDK path
function Test-IsManagementSdk {
    param([string]$SdkPath)
    
    $dirName = Split-Path $SdkPath -Leaf
    return $dirName -like "*ResourceManager*"
}

# Read and parse tsp-location.yaml to get emitter configuration
function Get-EmitterFromTspLocation {
    param([string]$SdkPath)
    
    $tspLocationPath = Join-Path $SdkPath "tsp-location.yaml"
    
    if (-not (Test-Path $tspLocationPath)) {
        Write-Host "tsp-location.yaml not found at $tspLocationPath" -ForegroundColor Yellow
        return $null
    }
    
    try {
        # Read the YAML file
        $content = Get-Content $tspLocationPath -Raw
        
        # Simple parsing for emit field - look for lines containing emitter packages
        # This handles both array format (- item), single line arrays ([item]), and plain format
        if ($content -match '[\[\-\s]["\']?@azure-typespec/http-client-csharp-mgmt["\']?') {
            return "@azure-typespec/http-client-csharp-mgmt"
        }
        elseif ($content -match '[\[\-\s]["\']?@azure-typespec/http-client-csharp["\']?') {
            return "@azure-typespec/http-client-csharp"
        }
        elseif ($content -match '[\[\-\s]["\']?@typespec/http-client-csharp["\']?') {
            return "@typespec/http-client-csharp"
        }
        else {
            Write-Host "Could not determine emitter from tsp-location.yaml" -ForegroundColor Yellow
            return $null
        }
    }
    catch {
        Write-Warning "Failed to parse tsp-location.yaml: $($_.Exception.Message)"
        return $null
    }
}

# Map emitter package name to generator name and package name
function Get-GeneratorConfig {
    param(
        [string]$EmitterPackage,
        [string]$SdkPath
    )
    
    # If no emitter specified, fall back to auto-detection based on path
    if (-not $EmitterPackage) {
        $isManagementSdk = Test-IsManagementSdk $SdkPath
        if ($isManagementSdk) {
            return @{
                PackageName = "http-client-csharp-mgmt"
                GeneratorName = "ManagementClientGenerator"
                ScopeName = "@azure-typespec"
            }
        } else {
            return @{
                PackageName = "http-client-csharp"
                GeneratorName = "ScmCodeModelGenerator"
                ScopeName = "@azure-typespec"
            }
        }
    }
    
    # Map emitter package to generator configuration
    switch -Regex ($EmitterPackage) {
        ".*http-client-csharp-mgmt" {
            return @{
                PackageName = "http-client-csharp-mgmt"
                GeneratorName = "ManagementClientGenerator"
                ScopeName = "@azure-typespec"
            }
        }
        "@typespec/http-client-csharp" {
            return @{
                PackageName = "http-client-csharp"
                GeneratorName = "ScmCodeModelGenerator"
                ScopeName = "@typespec"
            }
        }
        ".*http-client-csharp" {
            return @{
                PackageName = "http-client-csharp"
                GeneratorName = "AzureClientGenerator"
                ScopeName = "@azure-typespec"
            }
        }
        default {
            Write-Warning "Unknown emitter package: $EmitterPackage, using default AzureClientGenerator"
            return @{
                PackageName = "http-client-csharp"
                GeneratorName = "AzureClientGenerator"
                ScopeName = "@azure-typespec"
            }
        }
    }
}

# Rebuild the local generator solution to ensure fresh DLLs
function Build-LocalGeneratorSolution {
    param([string]$PackageRoot)
    
    $solutionPath = Join-Path $PackageRoot "generator/Microsoft.TypeSpec.Generator.sln"
    
    if (-not (Test-Path $solutionPath)) {
        Write-Warning "Solution file not found at: $solutionPath"
        return $false
    }
    
    Write-Host "Rebuilding local generator solution to ensure fresh DLLs..." -ForegroundColor Yellow
    
    try {
        $result = & dotnet build $solutionPath --configuration Release 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Build failed with exit code $LASTEXITCODE : $result"
            return $false
        }
        Write-Host "Build completed successfully." -ForegroundColor Green
        return $true
    }
    catch {
        Write-Warning "Build failed: $($_.Exception.Message)"
        return $false
    }
}

# Copy local generator DLLs to the SDK's node_modules location
function Copy-LocalGeneratorDlls {
    param(
        [string]$SdkPath,
        [string]$PackageName,
        [string]$ScopeName
    )
    
    $scriptDir = Split-Path $MyInvocation.PSCommandPath -Parent
    $packageRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
    $sourceDir = Join-Path $packageRoot "dist/generator"
    
    $targetDir = Join-Path $SdkPath "TempTypeSpecFiles/node_modules/$ScopeName/$PackageName/dist/generator"
    
    # Rebuild the solution first to ensure fresh DLLs
    $buildSuccess = Build-LocalGeneratorSolution $packageRoot
    if (-not $buildSuccess) {
        Write-Warning "Build failed, but continuing with existing DLLs..."
    }
    
    # Ensure target directory exists
    if (-not (Test-Path $targetDir)) {
        New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
    }
    
    # List of DLLs to copy
    $dllsToCopy = @(
        "Microsoft.TypeSpec.Generator.dll",
        "Microsoft.TypeSpec.Generator.ClientModel.dll", 
        "Microsoft.TypeSpec.Generator.Input.dll"
    )
    
    Write-Host "Copying local generator DLLs to node_modules location..." -ForegroundColor Yellow
    
    foreach ($dll in $dllsToCopy) {
        $sourcePath = Join-Path $sourceDir $dll
        $targetPath = Join-Path $targetDir $dll
        
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $targetPath -Force
            Write-Host "  Copied: $dll" -ForegroundColor Green
        } else {
            Write-Warning "Source DLL not found: $sourcePath"
        }
    }
    
    Write-Host "DLL copying completed." -ForegroundColor Green
}

# Add or update a debug profile in launchSettings.json
function Add-DebugProfile {
    param(
        [string]$SdkPath
    )
    
    $launchSettings = Get-LaunchSettings
    $profileName = Get-ProfileName $SdkPath
    $resolvedSdkPath = Resolve-Path $SdkPath
    
    # Try to read emitter configuration from tsp-location.yaml
    $emitterPackage = Get-EmitterFromTspLocation $SdkPath
    
    # Get generator configuration based on emitter package (falls back to auto-detection if not found)
    $generatorConfig = Get-GeneratorConfig $emitterPackage $SdkPath
    $packageName = $generatorConfig.PackageName
    $generatorName = $generatorConfig.GeneratorName
    $scopeName = $generatorConfig.ScopeName
    
    # Copy local DLLs to the node_modules location
    Copy-LocalGeneratorDlls $resolvedSdkPath $packageName $scopeName
    
    # Use the node_modules DLL path
    $dllPath = "`"$resolvedSdkPath/TempTypeSpecFiles/node_modules/$scopeName/$packageName/dist/generator/Microsoft.TypeSpec.Generator.dll`""
    
    # Create the new profile
    $newProfile = @{
        commandLineArgs = "$dllPath `"$resolvedSdkPath`" -g $generatorName"
        commandName = "Executable"
        executablePath = "dotnet"
    }
    
    # Add or update the profile
    $launchSettings.profiles | Add-Member -Name $profileName -Value $newProfile -MemberType NoteProperty -Force
    
    Set-LaunchSettings $launchSettings
    
    Write-Host "Added debug profile '$profileName' to launchSettings.json" -ForegroundColor Green
    Write-Host "Profile configuration:" -ForegroundColor Cyan
    Write-Host "  - Executable: dotnet" -ForegroundColor White
    Write-Host "  - Arguments: $dllPath `"$resolvedSdkPath`" -g $generatorName" -ForegroundColor White
    Write-Host "  - Generator: $generatorName" -ForegroundColor White
    Write-Host "  - Package: $packageName" -ForegroundColor White
    if ($emitterPackage) {
        Write-Host "  - Emitter: $emitterPackage (from tsp-location.yaml)" -ForegroundColor White
    } else {
        Write-Host "  - Emitter: auto-detected from SDK path" -ForegroundColor White
    }
    
    return $profileName
}

# Main execution
try {
    # Check if SDK directory exists
    $sdkPath = Resolve-Path $SdkDirectory -ErrorAction Stop
    
    # Check if npm is available
    if (-not (Test-CommandExists "npm")) {
        throw "npm is not installed or not in PATH"
    }
    
    # Install tsp-client if not installed
    if (-not (Test-TspClientInstalled)) {
        Write-Host "tsp-client is not installed. Installing now..." -ForegroundColor Yellow
        try {
            Install-TspClient
        }
        catch {
            Write-Warning "Failed to install tsp-client. You may need to install it manually with:"
            Write-Warning "npm install -g @azure-tools/typespec-client-generator-cli"
            Write-Warning "Error: $($_.Exception.Message)"
        }
    }
    else {
        Write-Host "tsp-client is already installed." -ForegroundColor Green
    }
    
    # Run tsp-client commands
    Invoke-TspClientCommands $sdkPath
    
    # Add debug profile
    $profileName = Add-DebugProfile $sdkPath
    
    Write-Host "`nSetup completed successfully!" -ForegroundColor Green
    Write-Host "You can now debug the '$profileName' profile in Visual Studio or VS Code." -ForegroundColor Cyan
}
catch {
    Write-Error "Error: $($_.Exception.Message)"
    exit 1
}
