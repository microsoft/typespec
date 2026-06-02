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

            Invoke-LoggedCommand "./eng/scripts/Get-Spector-Coverage.ps1" -GroupOutput
        }
        finally {
            Pop-Location
        }
    }
    if ($GenerationChecks) {
        Set-StrictMode -Version 1

        Write-Host "Installing pnpm" -ForegroundColor Cyan
        Invoke-LoggedCommand "npm install -g pnpm" -GroupOutput

        Write-Host "Setting up workspace" -ForegroundColor Cyan
        # Temporarily relax engine-strict so that pnpm install succeeds even when
        # the CI runner's Node version doesn't match every transitive dependency's
        # engines field (e.g. which@7 requiring a newer Node patch release).
        $env:npm_config_engine_strict = "false"
        Invoke-LoggedCommand "pnpm setup:min" $packageRoot/../..
        Remove-Item Env:\npm_config_engine_strict -ErrorAction SilentlyContinue

        Write-Host "Regenerating extern signatures" -ForegroundColor Cyan
        Invoke-LoggedCommand "npm run gen-extern-signature" -GroupOutput

        Invoke-LoggedCommand "npm run build && npm run regen-docs" -GroupOutput
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
