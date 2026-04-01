#Requires -Version 7.0
<#
.SYNOPSIS
    Checks for uncommitted git changes.

.DESCRIPTION
    This script verifies that there are no uncommitted changes in the repository.
    It excludes package.json and package-lock.json from the check since those
    may be modified during npm operations.

    Used by CI to ensure regeneration produces consistent output.

.PARAMETER Exceptions
    Additional paths to exclude from the check (not currently used).

.EXAMPLE
    ./Check-GitChanges.ps1
#>

param(
    [string] $Exceptions
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Setup paths and helpers
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

# Files to exclude from diff check (these may change during npm operations)
$excludedFiles = @(
    "$packageRoot/package.json"
    "$packageRoot/package-lock.json"
)

$diffExcludes = $excludedFiles | ForEach-Object { "`":(exclude)$_`"" } | Join-String -Separator ' '

# Check for changes, ignoring whitespace differences at end of lines
Invoke-LoggedCommand "git -c core.safecrlf=false diff --ignore-space-at-eol --exit-code -- $diffExcludes" -IgnoreExitCode

if ($LastExitCode -ne 0) {
    Write-Host "`nUncommitted changes detected!" -ForegroundColor Red
    Write-Host "Run 'npm run regenerate' locally and commit the changes."
    throw "Changes detected"
}

Write-Host "No changes detected." -ForegroundColor Green
