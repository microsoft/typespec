#Requires -Version 7.0

param($filter)

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;
Import-Module "$PSScriptRoot\CadlRanch-Helper.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Refresh-Build

$specsDirectory = "$packageRoot/node_modules/@azure-tools/cadl-ranch-specs"
$cadlRanchRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch'
$directories = Get-ChildItem -Path "$cadlRanchRoot" -Directory -Recurse
$cadlRanchCsproj = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch.Tests' 'TestProjects.CadlRanch.Tests.csproj'

$coverageDir = Join-Path $packageRoot 'generator' 'artifacts' 'coverage'

if (-not (Test-Path $coverageDir)) {
    New-Item -ItemType Directory -Path $coverageDir | Out-Null
}

foreach ($directory in $directories) {
    if (-not (IsGenerated $directory.FullName)) {
        continue
    }

    $outputDir = $directory.FullName.Substring(0, $directory.FullName.IndexOf("src") - 1)
    $subPath = $outputDir.Substring($cadlRanchRoot.Length + 1)
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    if (-not (Compare-Paths $subPath $filter)) {
        continue
    }
    
    $testPath = "$cadlRanchRoot.Tests"
    $testFilter = "TestProjects.CadlRanch.Tests"
    foreach ($folder in $folders) {
        $segment = "$(Get-Namespace $folder)"
        
        # the test directory names match the test namespace names, but the source directory names will not have the leading underscore
        # so check to see if the filter should contain a leading underscore by comparing with the test directory
        if (-not (Test-Path (Join-Path $testPath $segment))) {
          $testFilter += "._$segment"
          $testPath = Join-Path $testPath "_$segment"
        }
        else{
          $testFilter += ".$segment"
          $testPath = Join-Path $testPath $segment
        }
    }

    Write-Host "Regenerating $subPath" -ForegroundColor Cyan

    $specFile = Join-Path $specsDirectory $subPath "client.tsp"
    if (-not (Test-Path $specFile)) {
        $specFile = Join-Path $specsDirectory $subPath "main.tsp"
    }

    $command = Get-TspCommand $specFile $outputDir
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Write-Host "Testing $subPath" -ForegroundColor Cyan
    $command  = "dotnet test $cadlRanchCsproj --filter `"FullyQualifiedName~$testFilter`""
    Invoke $command
    # exit if the testing failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Write-Host "Restoring $subPath" -ForegroundColor Cyan
    $command = "git clean -xfd $outputDir"
    Invoke $command
    # exit if the restore failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
    $command = "git restore $outputDir"
    Invoke $command
    # exit if the restore failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
