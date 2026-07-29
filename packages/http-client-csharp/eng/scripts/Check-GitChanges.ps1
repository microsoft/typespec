#Requires -Version 7.0

param(
    [string] $Exceptions
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

$diffExcludes = @(
    "$packageRoot/package.json"
    "$packageRoot/package-lock.json"
) | ForEach-Object { "`":(exclude)$_`"" } | Join-String -Separator ' '

Invoke-LoggedCommand "git -c core.safecrlf=false diff --ignore-space-at-eol --exit-code -- $diffExcludes" -IgnoreExitCode

if($LastExitCode -ne 0) {
    throw "Changes detected"
}

# Check for untracked files that should have been committed (e.g. newly generated files)
$generatorRoot = "$packageRoot/generator"
$untrackedOutput = Invoke-LoggedCommand "git ls-files --others --exclude-standard -- $generatorRoot"
if ($untrackedOutput) {
    Write-Host "Untracked files detected:"
    Write-Host $untrackedOutput
    throw "Untracked files detected"
}
