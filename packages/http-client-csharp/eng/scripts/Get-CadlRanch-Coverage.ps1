#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;
Import-Module "$PSScriptRoot\CadlRanch-Helper.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Refresh-Build

$specsDirectory = "$packageRoot/node_modules/@azure-tools/cadl-ranch-specs"
$cadlRanchRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch'
$directories = Get-ChildItem -Path "$cadlRanchRoot" -Directory -Recurse
$cadlRanchCsproj = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch.Tests' 'TestProjects.CadlRanch.Tests.csproj'
$runSettings = Join-Path $packageRoot 'eng' 'test-configurations' 'cadlranch.runsettings'

$coverageDir = Join-Path $packageRoot 'generator' 'artifacts' 'coverage'

if (-not (Test-Path $coverageDir)) {
    New-Item -ItemType Directory -Path $coverageDir | Out-Null
}

# generate all
foreach ($directory in $directories) {
    if (-not (IsGenerated $directory.FullName)) {
        continue
    }

    $outputDir = $directory.FullName.Substring(0, $directory.FullName.IndexOf("src") - 1)
    $subPath = $outputDir.Substring($cadlRanchRoot.Length + 1)

    Write-Host "Regenerating $subPath" -ForegroundColor Cyan

    $specFile = Join-Path $specsDirectory $subPath "main.tsp"

    $command = Get-TspCommand $specFile $outputDir
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

# test all
Write-Host "Testing $subPath" -ForegroundColor Cyan
$command  = "dotnet test $cadlRanchCsproj --settings $runSettings"
Invoke $command
# exit if the generation failed
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# restore all
foreach ($directory in $directories) {
    if (-not (IsGenerated $directory.FullName)) {
        continue
    }

    $outputDir = $directory.FullName.Substring(0, $directory.FullName.IndexOf("src") - 1)
    $subPath = $outputDir.Substring($cadlRanchRoot.Length + 1)

    Write-Host "Restoring $subPath" -ForegroundColor Cyan
    $command = "git clean -xfd $outputDir"
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
    $command = "git restore $outputDir"
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
