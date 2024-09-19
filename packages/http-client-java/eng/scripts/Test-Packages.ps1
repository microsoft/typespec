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

Write-Host "PATH: $env:PATH"
Invoke-LoggedCommand "java -version"
Invoke-LoggedCommand "mvn -version"

Push-Location $packageRoot
try {
    if ($UnitTests) {
        Push-Location "$packageRoot"
        try {
            Write-Host "Current PATH: $env:PATH"
            Write-Host "Current JAVA_HOME: $Env:JAVA_HOME"
            $env:JAVA_HOME = $env:JAVA_HOME_21_X64
            Write-Host "Updated JAVA_HOME: $Env:JAVA_HOME"

            $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

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
            $generatorTestDir = Join-Path $packageRoot 'generator/http-client-generator-test'
            Set-Location $generatorTestDir
            & ./CadlRanch-Tests.ps1
            Set-Location $packageRoot
            Write-Host 'Cadl ranch tests passed'
        } 
        catch {
            Write-Error "Cadl ranch tests failed:  $_"
        }
    }
}
finally {
    Pop-Location
}
