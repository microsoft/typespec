#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..' 'generator')
$mgcArtifactRoot = Join-Path $repoRoot 'artifacts' 'bin' 'Microsoft.Generator.CSharp' 'Debug' 'net8.0'
$clientModelTestProjectsDirectory = Join-Path $repoRoot 'Microsoft.Generator.CSharp.ClientModel.TestProjects'

Invoke "dotnet build $repoRoot"

$mgcPath = Join-Path $mgcArtifactRoot "Microsoft.Generator.CSharp"
$unbrandedTypespecTestProject = Join-Path $clientModelTestProjectsDirectory "Unbranded-TypeSpec"
Invoke "$mgcPath $unbrandedTypespecTestProject"
