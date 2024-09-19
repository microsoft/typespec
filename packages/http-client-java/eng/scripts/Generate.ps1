#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

$env:JAVA_HOME = $env:JAVA_HOME_21_X64
Write-Host "JAVA_HOME: $Env:JAVA_HOME"

$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Invoke "npm run build:generator"
Invoke "npm run build:emitter"

$testDir = Join-Path $repoRoot 'test' 

$generatorTestDir = Join-Path $repoRoot 'generator/http-client-generator-test'
Set-Location $generatorTestDir
./Generate.ps1
Set-Location $PSScriptRoot
