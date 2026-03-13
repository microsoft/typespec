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

# Function to get the latest GA (non-prerelease) version of a package
function Get-LatestGAVersion {
    param(
        [string]$PackageName
    )
    
    Write-Host "Getting latest GA version for $PackageName..."
    $result = & npm view $PackageName dist-tags.latest 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result) {
        $latestVersion = $result.Trim()
        Write-Host "Found latest GA version for ${PackageName}: $latestVersion"
        return $latestVersion
    } else {
        Write-Warning "Could not determine latest GA version for $PackageName"
        return $null
    }
}

# Function to check if a dependency version's peer dep on tcgc is satisfied by our tcgcVersion
function Test-TcgcCompatibility {
    param(
        [string]$PackageName,
        [string]$PackageVersion,
        [string]$TcgcVersion
    )
    
    Write-Host "Checking if $PackageName@$PackageVersion is compatible with tcgc@$TcgcVersion..."
    $tcgcRange = & npm view "${PackageName}@${PackageVersion}" "peerDependencies.@azure-tools/typespec-client-generator-core" 2>&1
    
    if ($LASTEXITCODE -ne 0 -or -not $tcgcRange) {
        Write-Host "  No tcgc peer dependency found, assuming compatible"
        return $true
    }
    
    $tcgcRange = ($tcgcRange | Out-String).Trim()
    Write-Host "  Requires tcgc: $tcgcRange"
    
    $jsCode = "try{console.log(require('semver').satisfies('$TcgcVersion','$tcgcRange'))}catch(e){console.log('error')}"
    $semverResult = (& node -e $jsCode 2>&1 | Out-String).Trim()
    
    if ($semverResult -eq 'true') {
        Write-Host "  ✓ Compatible"
        return $true
    } else {
        Write-Host "  ✗ Not compatible"
        return $false
    }
}

# Function to get previous GA versions of a package sorted descending, before a given version
function Get-PreviousGAVersions {
    param(
        [string]$PackageName,
        [string]$BeforeVersion
    )
    
    Write-Host "Getting previous GA versions of $PackageName (before $BeforeVersion)..."
    $result = & npm view $PackageName versions --json 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not retrieve versions for $PackageName"
        return @()
    }
    
    $allVersions = ($result | Out-String) | ConvertFrom-Json
    
    if ($allVersions -isnot [array]) {
        $allVersions = @($allVersions)
    }
    
    # Filter to GA only (no prerelease) and versions strictly less than BeforeVersion
    $gaVersions = @($allVersions | Where-Object {
        $_ -notmatch '-' -and ([version]$_ -lt [version]$BeforeVersion)
    } | Sort-Object { [version]$_ } -Descending)
    
    if ($gaVersions.Count -gt 0) {
        Write-Host "  Found $($gaVersions.Count) previous GA version(s), most recent: $($gaVersions[0])"
    } else {
        Write-Host "  No previous GA versions found"
    }
    
    return $gaVersions
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
        $versionToUse = $null
        
        # 1. Try the tcgc version if it exists and is compatible with our tcgc
        if ((Test-PackageVersion -PackageName $dependency -Version $tcgcVersion) -and
            (Test-TcgcCompatibility -PackageName $dependency -PackageVersion $tcgcVersion -TcgcVersion $tcgcVersion)) {
            $versionToUse = $tcgcVersion
        }
        
        # 2. Search up to 2 previous GA versions for one compatible with our tcgc
        if (-not $versionToUse) {
            Write-Host "Searching previous GA versions of $dependency compatible with tcgc@$tcgcVersion..."
            $previousVersions = Get-PreviousGAVersions -PackageName $dependency -BeforeVersion $tcgcVersion
            $attempts = 0
            foreach ($prevVersion in $previousVersions) {
                if ($attempts -ge 2) { break }
                $attempts++
                
                if (Test-TcgcCompatibility -PackageName $dependency -PackageVersion $prevVersion -TcgcVersion $tcgcVersion) {
                    $versionToUse = $prevVersion
                    Write-Host "Found compatible previous version: $dependency@$prevVersion"
                    break
                }
            }
        }
        
        # 3. Fallback: use the version from tcgc's azure-core dependency
        if (-not $versionToUse -and $fallbackVersion) {
            if (Test-PackageVersion -PackageName $dependency -Version $fallbackVersion) {
                Write-Host "Using fallback version $fallbackVersion for $dependency"
                $versionToUse = $fallbackVersion
            }
        }
        
        # 4. Final fallback: latest GA version
        if (-not $versionToUse) {
            $latestGA = Get-LatestGAVersion -PackageName $dependency
            if ($latestGA) {
                Write-Host "Using latest GA version $latestGA for $dependency"
                $versionToUse = $latestGA
            }
        }
        
        if (-not $versionToUse) {
            Write-Error "Could not determine a valid version for $dependency (no fallback available)"
            exit 1
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