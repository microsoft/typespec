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
        # test the emitter
        Push-Location "$packageRoot"
        try {
            Invoke-LoggedCommand "npm run build" -GroupOutput
            Invoke-LoggedCommand "npm run test" -GroupOutput
        }
        finally {
            Pop-Location
        }
    }
}
finally {
    Pop-Location
}
