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
            Invoke-LoggedCommand "npm run test:emitter" -GroupOutput

            # test the generator
            Invoke-LoggedCommand "dotnet test ./generator" -GroupOutput

            Invoke-LoggedCommand "./eng/scripts/Get-CadlRanch-Coverage.ps1" -GroupOutput
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
    }
}
finally {
    Pop-Location
}
