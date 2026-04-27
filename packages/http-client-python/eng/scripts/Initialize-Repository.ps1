#Requires -Version 7.0
<#
.SYNOPSIS
    Initializes the repository by installing npm dependencies.

.DESCRIPTION
    This script is called by the CI pipeline to set up the repository.
    It runs `npm ci` to install dependencies from package-lock.json.

.PARAMETER BuildArtifactsPath
    Optional path to build artifacts (used in CI for caching lock files).

.PARAMETER UseTypeSpecNext
    Optional switch for using TypeSpec next version (not currently used).

.EXAMPLE
    ./Initialize-Repository.ps1
#>

param(
    [string] $BuildArtifactsPath,
    [switch] $UseTypeSpecNext
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Setup paths and helpers
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

Push-Location "$packageRoot"
try {
    # Clean install of npm dependencies
    if (Test-Path "./node_modules") {
        Write-Host "Removing existing node_modules..."
        Remove-Item -Recurse -Force "./node_modules"
    }

    Write-Host "Installing npm dependencies..."
    Invoke-LoggedCommand "npm ci"
    Invoke-LoggedCommand "npm ls -a" -GroupOutput

    # Copy lock files to artifacts for CI caching (if running in Azure DevOps)
    $artifactStagingDirectory = $env:BUILD_ARTIFACTSTAGINGDIRECTORY
    if ($artifactStagingDirectory -and !$BuildArtifactsPath) {
        $lockFilesPath = "$artifactStagingDirectory/lock-files/emitter"
        New-Item -ItemType Directory -Path $lockFilesPath -Force | Out-Null

        Write-Host "Copying lock files to $lockFilesPath"
        Copy-Item './package.json' "$lockFilesPath/package.json" -Force
        Copy-Item './package-lock.json' "$lockFilesPath/package-lock.json" -Force
    }
}
finally {
    Pop-Location
}
