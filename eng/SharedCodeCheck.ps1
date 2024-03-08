#Requires -Version 6.0

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 1

Write-Host 'Downloading shared source files...'
& (Join-Path $PSScriptRoot 'DownloadSharedSource.ps1')
Write-Host 'Shared source files are downloaded'

Write-Host 'Checking file difference...'
git -c core.safecrlf=false diff --ignore-space-at-eol --exit-code
if ($LastExitCode -ne 0)
{
    Write-Error 'Shared source files are updated. Please run eng/DownloadSharedSource.ps1'
    exit 1
}
Write-Host 'Done. No change is detected.'
