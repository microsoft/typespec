#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

$env:JAVA_HOME = $env:JAVA_HOME_21_X64
Write-Host "JAVA_HOME: $Env:JAVA_HOME"

$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Invoke "npm run build:generator"
Invoke "npm run build:emitter"

$generatorTestDir = Join-Path $packageRoot 'generator/http-client-generator-test'
Set-Location $generatorTestDir
./Generate.ps1
Set-Location $PSScriptRoot

$generatorTestDir = Join-Path $packageRoot 'generator/http-client-generator-clientcore-test'
Set-Location $generatorTestDir
./Generate.ps1
Set-Location $PSScriptRoot
