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
        Write-Host "Generating test projects with pyodide ..."
        & "$packageRoot/eng/scripts/Generate-WithPyodide.ps1"
        Write-Host 'Code generation is completed.'

        try {
          Write-Host 'Checking for differences in generated code...'
          & "$packageRoot/eng/scripts/Check-GitChanges.ps1"
          Write-Host 'Done. No code generation differences detected.'
        }
        catch {
            Write-Error 'Generated code is not up to date. Please run: eng/scripts/Generate.ps1'
        }

        try {
          # Run test
          Write-Host 'Running tests based on generated code with pyodide'
          & npm run ci
          Write-Host 'All tests passed'
        } 
        catch {
            Write-Error "Tests failed:  $_"
        }

        Write-Host "Generating test projects with venv ..."
        & "$packageRoot/eng/scripts/Generate.ps1"
        Write-Host 'Code generation is completed.'

        try {
            Write-Host 'Checking for differences in generated code...'
            & "$packageRoot/eng/scripts/Check-GitChanges.ps1"
            Write-Host 'Done. No code generation differences detected.'
        }
        catch {
            Write-Error 'Generated code is not up to date. Please run: eng/scripts/Generate.ps1'
        }

        try {
            # Run test
            Write-Host 'Running tests based on generated code with venv'
            & npm run ci
            Write-Host 'All tests passed'
        } 
        catch {
            Write-Error "Tests failed:  $_"
        }
    }
}
finally {
    Pop-Location
}
