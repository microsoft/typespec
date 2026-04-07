#Requires -Version 7.0
<#
.SYNOPSIS
    Builds and packages the TypeSpec Python emitter for publishing.

.DESCRIPTION
    This script is called by the CI pipeline to create publishable packages.
    It runs:
      1. npm run build     - Compile TypeScript emitter and build Python wheel
      2. npm run lint      - Run linting (Linux only)
      3. npm pack          - Create npm tarball for publishing

.PARAMETER BuildNumber
    The build number for versioning.

.PARAMETER Output
    Output directory for built packages. Defaults to ./ci-build.

.PARAMETER Prerelease
    Flag indicating if this is a prerelease build.

.PARAMETER PublishType
    Type of publish: "internal" for dev feed, otherwise public.

.EXAMPLE
    ./Build-Packages.ps1 -Output ./dist
#>

param(
    [string] $BuildNumber,
    [string] $Output,
    [switch] $Prerelease,
    [string] $PublishType
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Setup paths and helpers
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

# Helper function to write package info for downstream publishing
function Write-PackageInfo {
    param(
        [string] $packageName,
        [string] $directoryPath,
        [string] $version
    )

    $packageInfoPath = "$outputPath/PackageInfo"
    if (!(Test-Path $packageInfoPath)) {
        New-Item -ItemType Directory -Force -Path $packageInfoPath | Out-Null
    }

    @{
        Name          = $packageName
        Version       = $version
        DirectoryPath = $directoryPath
        SdkType       = "client"
        IsNewSdk      = $true
        ReleaseStatus = "Unreleased"
    } | ConvertTo-Json | Set-Content -Path "$packageInfoPath/$packageName.json"
}

Write-Host "Building packages for BuildNumber: '$BuildNumber', Output: '$Output', Prerelease: '$Prerelease', PublishType: '$PublishType'"

# Setup output directory
$outputPath = $Output ? $Output : "$packageRoot/ci-build"
$outputPath = New-Item -ItemType Directory -Force -Path $outputPath | Select-Object -ExpandProperty FullName
New-Item -ItemType Directory -Force -Path "$outputPath/packages" | Out-Null

# Get package version
$emitterVersion = node -p -e "require('$packageRoot/package.json').version"
Write-Host "Package version: $emitterVersion"

Push-Location "$packageRoot"
try {
    # Step 1: Build the emitter and generator
    Write-Host "`n=== Building emitter and generator ===" -ForegroundColor Cyan
    Invoke-LoggedCommand "npm run build" -GroupOutput

    # Step 2: Run linting (Linux only, as CI runs on Linux)
    if ($IsLinux) {
        Write-Host "`n=== Running lint checks ===" -ForegroundColor Cyan
        Invoke-LoggedCommand "npm run lint" -GroupOutput
    }

    # Step 3: Create npm package
    Write-Host "`n=== Creating npm package ===" -ForegroundColor Cyan
    Invoke-LoggedCommand "npm pack"
    Copy-Item "typespec-http-client-python-$emitterVersion.tgz" -Destination "$outputPath/packages"

    # Step 4: Verify package can be installed
    Write-Host "`n=== Verifying package installation ===" -ForegroundColor Cyan
    Invoke-LoggedCommand "npm install typespec-http-client-python-$emitterVersion.tgz" -GroupOutput

    # Write package info for publishing pipeline
    Write-PackageInfo -packageName "typespec-http-client-python" `
                      -directoryPath "packages/http-client-python/emitter/src" `
                      -version $emitterVersion
}
finally {
    Pop-Location
}

# Generate override URLs for internal publishing
$overrides = @{}
if ($PublishType -eq "internal") {
    $feedUrl = "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry"
    $overrides["@typespec/http-client-python"] = "$feedUrl/@typespec/http-client-python/-/http-client-python-$emitterVersion.tgz"
}
$overrides | ConvertTo-Json | Set-Content "$outputPath/overrides.json"

# Write package version matrix
@{ "emitter" = $emitterVersion } | ConvertTo-Json | Set-Content "$outputPath/package-versions.json"

Write-Host "`n=== Build complete ===" -ForegroundColor Green
Write-Host "Output: $outputPath"
