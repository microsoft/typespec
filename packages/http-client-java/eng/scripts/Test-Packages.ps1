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
        Write-Host "Current PATH: $env:PATH"
        Write-Host "Current JAVA_HOME: $Env:JAVA_HOME"
        $env:JAVA_HOME = $env:JAVA_HOME_21_X64
        Write-Host "Updated JAVA_HOME: $Env:JAVA_HOME"

        $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

        Write-Host "Updated PATH: $env:PATH"
        
        # Run Spector tests (unit tests included in java/typescript package build)
        try {
            $generatorTestDir = Join-Path $packageRoot 'generator/http-client-generator-test'
            Push-Location $generatorTestDir
            try {
                & ./Setup.ps1
                & ./Spector-Tests.ps1
                Set-Location $packageRoot
                Write-Host "Spector tests passed"
            }
            finally {
                Pop-Location
            }
        } 
        catch {
            Write-Error "Spector tests failed: $_"
        }
        # Copy coverage report to artifacts directory
        try {
            $coverageReportDir = Join-Path $packageRoot 'generator/artifacts/coverage'
            if (!(Test-Path $coverageReportDir)) {
                New-Item -ItemType Directory -Path $coverageReportDir

                $sourceFile = Join-Path $packageRoot 'generator/http-client-generator-test/tsp-spector-coverage-java-standard.json'
                $targetFile = Join-Path $coverageReportDir 'tsp-spector-coverage-java-standard.json'
                Copy-Item $sourceFile -Destination $targetFile
            }
        } catch {
            Write-Error "Failed to copy coverage report file: $_"
        }
    }
    if ($GenerationChecks) {
        Set-StrictMode -Version 1
        # Generate code for Spector tests
        Write-Host "Generating test projects ..."
        & "$packageRoot/eng/scripts/Generate.ps1"
        Write-Host 'Code generation is completed.'

        # Check difference between code in branch, and code just generated
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
