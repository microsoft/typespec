#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Invoke "npm run build:emitter"
# we don't want to build the entire solution because the test projects might not build until after regeneration
# generating Microsoft.Generator.CSharp.ClientModel.csproj is enough
Invoke "dotnet build $repoRoot/generator/Microsoft.Generator.CSharp.ClientModel.StubLibrary/src"

$testProjectsLocalDir = Join-Path $repoRoot 'generator' 'TestProjects' 'Local'

$unbrandedTypespecTestProject = Join-Path $testProjectsLocalDir "Unbranded-TypeSpec"
$command = "npx tsp compile $unbrandedTypespecTestProject/Unbranded-TypeSpec.tsp"
$command += " --trace @typespec/http-client-csharp"
$command += " --emit @typespec/http-client-csharp"
$command += " --option @typespec/http-client-csharp.emitter-output-dir=$unbrandedTypespecTestProject"
$command += " --option @typespec/http-client-csharp.save-inputs=true"
# $command += " --option @typespec/http-client-csharp.plugin-name=StubLibraryPlugin"

Invoke $command

Invoke "dotnet build $repoRoot/generator/TestProjects/Local/Unbranded-TypeSpec/src/UnbrandedTypeSpec.csproj"
