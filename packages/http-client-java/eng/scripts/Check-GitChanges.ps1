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
