#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Write-Host "Building project ..."
& npm run build

Write-Host "Regenerating project ..."
& npm run regenerate
