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
    '@azure-tools/typespec-azure-core',
    '@azure-tools/typespec-azure-rulesets',
    '@azure-tools/typespec-azure-resource-manager',
    '@azure-tools/typespec-autorest'
)

# Function to check if a package version exists
function Test-PackageVersion {
    param(
        [string]$PackageName,
        [string]$Version
    )
    
    Write-Host "Checking if $PackageName@$Version exists..."
    $checkResult = & npm view "$PackageName@$Version" version 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Found $PackageName@$Version"
        return $true
    } else {
        Write-Warning "✗ Package $PackageName@$Version not found"
        return $false
    }
}

# Function to get a specific dependency version from a package
function Get-PackageDependencyVersion {
    param(
        [string]$PackageName,
        [string]$PackageVersion,
        [string]$DependencyName
    )
    
    Write-Host "Getting $DependencyName version from $PackageName@$PackageVersion..."
    $result = & npm view "$PackageName@$PackageVersion" devDependencies.$DependencyName 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result) {
        $dependencyVersion = $result.Trim()
        $dependencyVersion = $dependencyVersion -replace '^[\^~]', ''
        Write-Host "Found $DependencyName version: $dependencyVersion"
        return $dependencyVersion
    } else {
        Write-Warning "Could not find $DependencyName in dependencies of $PackageName@$PackageVersion"
        return $null
    }
}

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
    $tcgc = '@azure-tools/typespec-client-generator-core'

    # Get the version of tcgc from devDependencies
    if (-not $packageJson.devDependencies -or -not $packageJson.devDependencies.PSObject.Properties[$tcgc]) {
        Write-Error "Could not find $tcgc in devDependencies"
        exit 1
    }

    $tcgcVersion = $packageJson.devDependencies.PSObject.Properties[$tcgc].Value
    Write-Host "Using version $tcgcVersion as base version for injected dependencies"

    # Get the fallback version from tcgc's @azure-tools/typespec-azure-core dependency
    $fallbackVersion = Get-PackageDependencyVersion -PackageName $tcgc -PackageVersion $tcgcVersion -DependencyName '@azure-tools/typespec-azure-core'
    if ($fallbackVersion) {
        Write-Host "Fallback version available: $fallbackVersion"
    }

    # Validate and inject the required dependencies
    Write-Host "Validating and injecting required dependencies..."
    $dependencyVersions = @{}
    
    foreach ($dependency in $InjectedDependencies) {
        $versionToUse = $tcgcVersion
        
        # Check if the tcgc version exists for this dependency
        if (-not (Test-PackageVersion -PackageName $dependency -Version $tcgcVersion)) {
            Write-Warning "Version $tcgcVersion not found for $dependency"
            
            # Use the version from tcgc's @azure-tools/typespec-azure-core dependency as fallback
            if ($fallbackVersion) {
                Write-Host "Using fallback version $fallbackVersion for all injected dependencies"
                $versionToUse = $fallbackVersion
            } else {
                Write-Error "Could not determine a valid version for $dependency (no fallback available)"
                exit 1
            }
        }
        
        # Store the version to use for this dependency
        $dependencyVersions[$dependency] = $versionToUse
        
        # Add the dependency to devDependencies
        $packageJson.devDependencies | Add-Member -Type NoteProperty -Name $dependency -Value $versionToUse -Force
        Write-Host "Added $dependency@$versionToUse to devDependencies"
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

    # Display summary of injected dependencies
    Write-Host "`nSummary of injected dependencies:"
    foreach ($dep in $dependencyVersions.Keys) {
        Write-Host "  $dep@$($dependencyVersions[$dep])"
    }

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