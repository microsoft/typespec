#!/usr/bin/env pwsh

<#
.DESCRIPTION
Updates the package.json file with required dependencies and validates them with npm install.
This script injects dependencies defined in the $InjectedDependencies variable and validates the dependencies 
with npm install. The tsp-client generate-config-files step is handled separately after repo cloning.

.PARAMETER PackageVersion
The version to set in the package.json file.

.PARAMETER PackageJsonPath
The path to the package.json file to update.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$PackageVersion,

    [Parameter(Mandatory = $true)]
    [string]$PackageJsonPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Define the list of dependencies to inject
$InjectedDependencies = @(
    '@azure-tools/typespec-azure-rulesets',
    '@azure-tools/typespec-azure-resource-manager',
    '@azure-tools/typespec-autorest'
)

# Resolve paths
$PackageJsonPath = Resolve-Path $PackageJsonPath

Write-Host "Updating package.json with dependencies and validating..."
Write-Host "Package Version: $PackageVersion"
Write-Host "Package.json Path: $PackageJsonPath"
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

    Write-Host "Successfully updated package.json and validated dependencies"
}
catch {
    Write-Error "Script failed with error: $_"
    exit 1
}