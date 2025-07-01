#!/usr/bin/env pwsh

<#
.DESCRIPTION
Updates the package.json file with required dependencies and then invokes tsp-client to generate config files.
This script injects dependencies defined in the $InjectedDependencies variable, validates the dependencies 
with npm install, and then calls tsp-client generate-config-files.

.PARAMETER PackageVersion
The version to set in the package.json file.

.PARAMETER PackageJsonPath
The path to the package.json file to update.

.PARAMETER EmitterPackageJsonPath
The path where the emitter package.json file should be generated.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$PackageVersion,

    [Parameter(Mandatory = $true)]
    [string]$PackageJsonPath,

    [Parameter(Mandatory = $true)]
    [string]$EmitterPackageJsonPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Define the list of dependencies to inject
$InjectedDependencies = @(
    '@azure-tools/typespec-azure-rulesets',
    '@azure-tools/typespec-azure-resource-manager'
)

# Resolve paths
$PackageJsonPath = Resolve-Path $PackageJsonPath
$EmitterPackageJsonPath = [System.IO.Path]::GetFullPath($EmitterPackageJsonPath)

Write-Host "Updating package.json and invoking tsp-client..."
Write-Host "Package Version: $PackageVersion"
Write-Host "Package.json Path: $PackageJsonPath"
Write-Host "Emitter Package.json Path: $EmitterPackageJsonPath"
Write-Host "Current Working Directory: $(Get-Location)"

try {
    # Set the package version
    Write-Host "Setting package version to $PackageVersion..."
    $npmSetResult = & npm pkg set version="$PackageVersion" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to set package version: $npmSetResult"
        exit 1
    }

    # Read and modify package.json
    Write-Host "Reading package.json..."
    if (-not (Test-Path $PackageJsonPath)) {
        Write-Error "Package.json file not found at: $PackageJsonPath"
        exit 1
    }

    $packageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json

    # Get the version of @azure-tools/typespec-azure-core from devDependencies
    if (-not $packageJson.devDependencies -or -not $packageJson.devDependencies.'@azure-tools/typespec-azure-core') {
        Write-Error "Could not find @azure-tools/typespec-azure-core in devDependencies"
        exit 1
    }

    $azureCoreVersion = $packageJson.devDependencies.'@azure-tools/typespec-azure-core'
    Write-Host "Using version $azureCoreVersion for injected dependencies"

    # Inject the required dependencies with the same version
    Write-Host "Injecting required dependencies..."
    foreach ($dependency in $InjectedDependencies) {
        $packageJson.devDependencies | Add-Member -Type NoteProperty -Name $dependency -Value $azureCoreVersion -Force
    }

    # Create array of all peerDependencies plus the injected dependencies
    $peerDeps = @()
    if ($packageJson.peerDependencies) {
        $peerDeps = @($packageJson.peerDependencies.PSObject.Properties.Name)
    }
    $allDeps = $peerDeps + $InjectedDependencies

    # Add the azure-sdk/emitter-package-json-pinning property
    Write-Host "Adding azure-sdk/emitter-package-json-pinning property..."
    $packageJson | Add-Member -Type NoteProperty -Name 'azure-sdk/emitter-package-json-pinning' -Value $allDeps -Force

    # Write the updated package.json back
    Write-Host "Writing updated package.json..."
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $PackageJsonPath

    # Validate dependencies by running npm install
    Write-Host "Validating dependencies with npm install..."
    $npmInstallResult = & npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed after injecting dependencies: $npmInstallResult"
        exit 1
    }

    # Generate emitter-package.json files using tsp-client
    Write-Host "Generating emitter-package.json files..."
    $tspClientResult = & tsp-client generate-config-files --package-json "$PackageJsonPath" --emitter-package-json-path "$EmitterPackageJsonPath" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "tsp-client generate-config-files failed: $tspClientResult"
        exit 1
    }

    Write-Host "Successfully updated package.json and generated emitter config files"
}
catch {
    Write-Error "Script failed with error: $_"
    exit 1
}