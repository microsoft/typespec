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

Invoke-LoggedCommand "python --version"

Push-Location $packageRoot
try {
    if ($UnitTests) {
        Push-Location "$packageRoot"
        try {

            Write-Host "Updated PATH: $env:PATH"
            # test the emitter
            Invoke-LoggedCommand "npm run build" -GroupOutput
            
        }
        finally {
            Pop-Location
        }
    }
    if ($GenerationChecks) {
        Set-StrictMode -Version 1
        
        # run E2E Test for TypeSpec emitter
        Write-Host "Generating test projects ..."
        & "$packageRoot/eng/scripts/Generate.ps1"
        Write-Host 'Code generation is completed.'

        try {
            Write-Host 'Checking for differences in generated code...'
            & "$packageRoot/eng/scripts/Check-GitChanges.ps1"
            Write-Host 'Done. No code generation differences detected.'
        }
        catch {
            Write-Error 'Generated code is not up to date. Please run: eng/Generate.ps1'
        }

        try {
            Write-Host "Pip List" 
            & pip list
            # Run tox
            Write-Host 'Running tests'
            & npm run ci
            Write-Host 'tox tests passed'
        } 
        catch {
            Write-Error "Cadl ranch tests failed:  $_"
        }
    }
}
finally {
    Pop-Location
}
