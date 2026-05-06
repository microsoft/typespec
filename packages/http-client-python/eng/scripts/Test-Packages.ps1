#Requires -Version 7.0
<#
.SYNOPSIS
    Runs tests for the TypeSpec Python emitter.

.DESCRIPTION
    This script is called by the CI pipeline to run tests.

    With -UnitTests:
      - Runs npm run build (compile emitter)

    With -GenerationChecks:
      - Runs npm run build (compile emitter)
      - Runs Generate.ps1 (regenerate test fixtures)
      - Runs Check-GitChanges.ps1 (verify no uncommitted changes)
      - Runs npm run ci (full test suite: pytest, lint, mypy, pyright)

.PARAMETER UnitTests
    Run unit tests only (just builds the project).

.PARAMETER GenerationChecks
    Run full generation checks and test suite.

.PARAMETER Filter
    Optional filter pattern for tests (not currently used).

.EXAMPLE
    ./Test-Packages.ps1 -GenerationChecks
#>

param(
    [switch] $UnitTests,
    [switch] $GenerationChecks,
    [string] $Filter = "."
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Setup paths and helpers
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

Write-Host "Python version:"
Invoke-LoggedCommand "python --version"

Push-Location $packageRoot
try {
    if ($UnitTests) {
        Write-Host "`n=== Running unit tests ===" -ForegroundColor Cyan
        Invoke-LoggedCommand "npm run build" -GroupOutput
    }

    if ($GenerationChecks) {
        # Step 1: Regenerate all test fixtures
        Write-Host "`n=== Regenerating test fixtures ===" -ForegroundColor Cyan
        & "$packageRoot/eng/scripts/Generate.ps1"

        # Step 2: Check for uncommitted changes (regeneration should be clean)
        Write-Host "`n=== Checking for uncommitted changes ===" -ForegroundColor Cyan
        try {
            & "$packageRoot/eng/scripts/Check-GitChanges.ps1"
            Write-Host "No uncommitted changes detected." -ForegroundColor Green
        }
        catch {
            Write-Error "Generated code is not up to date. Please run: npm run regenerate"
        }

        # Step 3: Run full test suite
        Write-Host "`n=== Running full test suite ===" -ForegroundColor Cyan
        Write-Host "Installed packages:"
        & pip list

        Invoke-LoggedCommand "npm run ci"
        Write-Host "All tests passed." -ForegroundColor Green
    }
}
finally {
    Pop-Location
}
