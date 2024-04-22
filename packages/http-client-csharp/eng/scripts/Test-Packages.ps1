#Requires -Version 7.0

param(
    [switch] $UnitTests,
    [switch] $GenerationChecks,
    [string] $Filter = "."
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

Push-Location $packageRoot
try {
    if ($UnitTests) {
        Push-Location "$packageRoot"
        try {
            # test the emitter
            Invoke-LoggedCommand "npm run build" -GroupOutput
            Invoke-LoggedCommand "npm run test" -GroupOutput

            # test the generator
            Invoke-LoggedCommand "dotnet test ./generator" -GroupOutput
        }
        finally {
            Pop-Location
        }
    }
}
finally {
    Pop-Location
}
