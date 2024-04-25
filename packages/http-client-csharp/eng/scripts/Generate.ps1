#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Invoke "npm run build"

$mgcArtifactRoot = Join-Path $repoRoot 'dist' 'generator'
$clientModelTestProjectsDirectory = Join-Path $repoRoot 'generator' 'Microsoft.Generator.CSharp.ClientModel.TestProjects'

$mgcPath = Join-Path $mgcArtifactRoot "Microsoft.Generator.CSharp.exe"
$unbrandedTypespecTestProject = Join-Path $clientModelTestProjectsDirectory "Unbranded-TypeSpec"
Invoke "$mgcPath $unbrandedTypespecTestProject"
