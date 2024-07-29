#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Invoke "npm run build:emitter"
# we don't want to build the entire solution because the test projects might not build until after regeneration
# generating Microsoft.Generator.CSharp.ClientModel.csproj is enough
Invoke "npm run build:generator"

$testDir = Join-Path $repoRoot 'test' 

Invoke "npx tsp compile $testDir/literal.tsp --trace @typespec/http-client-java --emit @typespec/http-client-java --option @typespec/http-client-java.emitter-output-dir=$testDir --option @typespec/http-client-java.save-inputs=true"
