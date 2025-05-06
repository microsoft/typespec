#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

$env:JAVA_HOME = $env:JAVA_HOME_21_X64
Write-Host "JAVA_HOME: $Env:JAVA_HOME"

$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Generating http-client-generator-clientcore-test module ..."
$generatorTestDir = Join-Path $packageRoot 'generator/http-client-generator-clientcore-test'
Push-Location $generatorTestDir
try {
    & "./Generate.ps1"
}
finally {
    Pop-Location
}

Write-Host "Generating http-client-generator-test module ..."
$generatorTestDir = Join-Path $packageRoot 'generator/http-client-generator-test'
Push-Location $generatorTestDir
try {
    & "./Generate.ps1"
}
finally {
    Pop-Location
}
