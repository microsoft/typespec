#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Invoke "npm run build:emitter"
# we don't want to build the entire solution because the test projects might not build until after regeneration
# generating Microsoft.Generator.CSharp.ClientModel.csproj is enough
Invoke "dotnet build $repoRoot/generator/Microsoft.Generator.CSharp.ClientModel/src"

$testProjectsLocalDir = Join-Path $repoRoot 'generator' 'TestProjects' 'Local'

$unbrandedTypespecTestProject = Join-Path $testProjectsLocalDir "Unbranded-TypeSpec"
Invoke "npx tsp compile $unbrandedTypespecTestProject/Unbranded-TypeSpec.tsp --trace @typespec/http-client-csharp --emit @typespec/http-client-csharp --option @typespec/http-client-csharp.emitter-output-dir=$unbrandedTypespecTestProject --option @typespec/http-client-csharp.save-inputs=true"

Invoke "dotnet build $repoRoot/generator/TestProjects/Local/Unbranded-TypeSpec/src/UnbrandedTypeSpec.csproj"
