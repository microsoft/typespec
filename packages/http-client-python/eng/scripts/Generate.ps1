#Requires -Version 7.0
<#
.SYNOPSIS
    Regenerates all test fixtures and documentation.

.DESCRIPTION
    This script is called by the CI pipeline to regenerate test outputs.
    It runs:
      1. npm run build       - Compile TypeScript emitter and build Python wheel
      2. npm run regenerate  - Regenerate all test fixtures from TypeSpec files
      3. npm run regen-docs  - Regenerate API documentation

.EXAMPLE
    ./Generate.ps1
#>

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Setup paths
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')

Push-Location "$packageRoot"
try {
    Write-Host "=== Building project ===" -ForegroundColor Cyan
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }

    Write-Host "`n=== Regenerating test fixtures ===" -ForegroundColor Cyan
    & npm run regenerate
    if ($LASTEXITCODE -ne 0) { throw "Regeneration failed" }

    Write-Host "`n=== Regenerating documentation ===" -ForegroundColor Cyan
    # Check if tspd is available (requires full monorepo build)
    $tspdCli = Join-Path $packageRoot "../../packages/tspd/dist/src/cli.js"
    if (Test-Path $tspdCli) {
        & npm run regen-docs
        if ($LASTEXITCODE -ne 0) { throw "Documentation regeneration failed" }
    } else {
        Write-Host "Skipping documentation regeneration (tspd not built)" -ForegroundColor Yellow
        Write-Host "Run from monorepo root with full build to regenerate docs" -ForegroundColor Yellow
    }

    Write-Host "`n=== Generation complete ===" -ForegroundColor Green
}
finally {
    Pop-Location
}
