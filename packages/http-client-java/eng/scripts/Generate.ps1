#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Write-Host "Current PATH: $env:PATH"
Write-Host "Current JAVA_HOME: $Env:JAVA_HOME"
$env:JAVA_HOME = $env:JAVA_HOME_21_X64
Write-Host "Updated JAVA_HOME: $Env:JAVA_HOME"

$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Updated PATH: $env:PATH"

Invoke "npm run build:generator"
Invoke "npm run build:emitter"

$testDir = Join-Path $repoRoot 'test' 

Invoke "npx tsp compile $testDir/literal.tsp --trace @typespec/http-client-java --emit @typespec/http-client-java --option @typespec/http-client-java.emitter-output-dir=$testDir/tsp-output --option @typespec/http-client-java.save-inputs=true"
