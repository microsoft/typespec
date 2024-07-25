#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

function Get-TspCommand {
    param (
        [string]$specFile,
        [string]$generationDir,
        [bool]$generateStub = $false
    )
    $command = "npx tsp compile $specFile"
    $command += " --trace @typespec/http-client-csharp"
    $command += " --emit @typespec/http-client-csharp"
    $command += " --option @typespec/http-client-csharp.emitter-output-dir=$generationDir"
    $command += " --option @typespec/http-client-csharp.save-inputs=true"
    if ($generateStub) {
        $command += " --option @typespec/http-client-csharp.plugin-name=StubLibraryPlugin"
    }
    return $command
}

Write-Host "Building emitter and generator" -ForegroundColor Cyan
Invoke "npm run build:emitter"
# exit if the generation failed
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# we don't want to build the entire solution because the test projects might not build until after regeneration
# generating Microsoft.Generator.CSharp.ClientModel.csproj is enough
Invoke "dotnet build $packageRoot/generator/Microsoft.Generator.CSharp.ClientModel.StubLibrary/src"
# exit if the generation failed
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Generating UnbrandedTypeSpec" -ForegroundColor Cyan
$testProjectsLocalDir = Join-Path $packageRoot 'generator' 'TestProjects' 'Local'

$unbrandedTypespecTestProject = Join-Path $testProjectsLocalDir "Unbranded-TypeSpec"

Invoke (Get-TspCommand "$unbrandedTypespecTestProject/Unbranded-TypeSpec.tsp" $unbrandedTypespecTestProject)

# exit if the generation failed
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Building UnbrandedTypeSpec" -ForegroundColor Cyan
Invoke "dotnet build $packageRoot/generator/TestProjects/Local/Unbranded-TypeSpec/src/UnbrandedTypeSpec.csproj"

# exit if the generation failed
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$specsDirectory = "$packageRoot/node_modules/@azure-tools/cadl-ranch-specs"
$cadlRanchRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch'

function IsSpecDir {
    param (
        [string]$dir
    )
    $subdirs = Get-ChildItem -Path $dir -Directory
    return -not ($subdirs) -and (Test-Path "$dir/main.tsp")
}

$failingSpecs = @(
    Join-Path 'http' 'special-words'
    Join-Path 'http' 'client' 'naming'
    Join-Path 'http' 'client' 'structure' 'default'
    Join-Path 'http' 'client' 'structure' 'multi-client'
    Join-Path 'http' 'client' 'structure' 'renamed-operation'
    Join-Path 'http' 'client' 'structure' 'two-operation-group'
    Join-Path 'http' 'encode' 'bytes'
    Join-Path 'http' 'encode' 'datetime'
    Join-Path 'http' 'encode' 'duration'
    Join-Path 'http' 'parameters' 'basic'
    Join-Path 'http' 'parameters' 'body-optionality'
    Join-Path 'http' 'parameters' 'collection-format'
    Join-Path 'http' 'parameters' 'spread'
    Join-Path 'http' 'payload' 'content-negotiation'
    Join-Path 'http' 'payload' 'json-merge-patch'
    Join-Path 'http' 'payload' 'media-type'
    Join-Path 'http' 'payload' 'multipart'
    Join-Path 'http' 'payload' 'pageable'
    Join-Path 'http' 'resiliency' 'srv-driven'
    Join-Path 'http' 'serialization' 'encoded-name' 'json'
    Join-Path 'http' 'server' 'endpoint' 'not-defined'
    Join-Path 'http' 'server' 'path' 'multiple'
    Join-Path 'http' 'server' 'path' 'single'
    Join-Path 'http' 'server' 'versions' 'not-versioned'
    Join-Path 'http' 'server' 'versions' 'versioned'
    Join-Path 'http' 'special-headers' 'conditional-request'
    Join-Path 'http' 'special-headers' 'repeatability'
    Join-Path 'http' 'type' 'array'
    Join-Path 'http' 'type' 'dictionary'
    Join-Path 'http' 'type' 'scalar'
    Join-Path 'http' 'type' 'union'
    Join-Path 'http' 'type' 'enum' 'extensible'
    Join-Path 'http' 'type' 'enum' 'fixed'
    Join-Path 'http' 'type' 'model' 'empty'
    Join-Path 'http' 'type' 'model' 'flatten'
    Join-Path 'http' 'type' 'model' 'usage'
    Join-Path 'http' 'type' 'model' 'visibility'
    Join-Path 'http' 'type' 'model' 'inheritance' 'enum-discriminator'
    Join-Path 'http' 'type' 'model' 'inheritance' 'nested-discriminator'
    Join-Path 'http' 'type' 'model' 'inheritance' 'not-discriminated'
    Join-Path 'http' 'type' 'model' 'inheritance' 'recursive'
    Join-Path 'http' 'type' 'model' 'inheritance' 'single-discriminator'
    Join-Path 'http' 'type' 'property' 'additional-properties'
    Join-Path 'http' 'type' 'property' 'nullable'
    Join-Path 'http' 'type' 'property' 'optionality'
    Join-Path 'http' 'type' 'property' 'value-types'
)

# Loop through all directories and subdirectories
$directories = Get-ChildItem -Path "$specsDirectory/http" -Directory -Recurse
foreach ($directory in $directories) {
    if (-not (IsSpecDir $directory.FullName)) {
        continue
    }

    $specFile = Join-Path $directory.FullName "main.tsp"
    $subPath = $directory.FullName.Substring($specsDirectory.Length + 1)
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    if ($folders.Contains("azure")) {
        continue
    }

    if ($folders.Contains("versioning")) {
        continue # TODO: adopt versioning cadl ranch specs https://github.com/microsoft/typespec/issues/3965
    }

    if ($failingSpecs.Contains($subPath)) {
        Write-Host "Skipping $subPath" -ForegroundColor Yellow
        continue
    }

    $generationDir = $cadlRanchRoot
    foreach ($folder in $folders) {
        $generationDir = Join-Path $generationDir $folder
    }

    #create the directory if it doesn't exist
    if (-not (Test-Path $generationDir)) {
        New-Item -ItemType Directory -Path $generationDir | Out-Null
    }

    Write-Host "Generating $subPath" -ForegroundColor Cyan
    Invoke (Get-TspCommand $specFile $generationDir $true)

    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    # TODO need to build but depends on https://github.com/Azure/autorest.csharp/issues/4463
}