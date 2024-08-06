#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Invoke "npm run build:generator"
Invoke "npm run build:emitter"

$testDir = Join-Path $repoRoot 'test' 

Invoke "npx tsp compile $testDir/literal.tsp --trace @typespec/http-client-java --emit @typespec/http-client-java --option @typespec/http-client-java.emitter-output-dir=$testDir --option @typespec/http-client-java.save-inputs=true"
