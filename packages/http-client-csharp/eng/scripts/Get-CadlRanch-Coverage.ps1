#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;
Import-Module "$PSScriptRoot\CadlRanch-Helper.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Refresh-Build

$specsDirectory = Join-Path $packageRoot 'node_modules' '@azure-tools' 'cadl-ranch-specs'
$cadlRanchRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch'
$directories = Get-ChildItem -Path "$cadlRanchRoot" -Directory -Recurse
$cadlRanchCsproj = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch.Tests' 'TestProjects.CadlRanch.Tests.csproj'

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

    if ($subPath.Contains($(Join-Path 'srv-driven' 'v1'))) {
        continue
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

    # srv-driven contains two separate specs, for two separate clients. We need to generate both.
    if ($subPath.Contains('srv-driven')) {
        Write-Host "Regenerating $subPath v1" -ForegroundColor Cyan
        $specFile = Join-Path $specsDirectory $subPath "old.tsp"
        $outputDir = Join-Path $outputDir "v1"
        # override namespace for "resiliency/srv-driven/old.tsp" (make it different to that from "main.tsp")
        $command = Get-TspCommand $specFile $outputDir -additionalOptions " --option @typespec/http-client-csharp.namespace=Resiliency.ServiceDriven.V1"

        Invoke $command
        # exit if the generation failed
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}

# test all
Write-Host "Generating CadlRanch coverage" -ForegroundColor Cyan
$command  = "dotnet test $cadlRanchCsproj"
Invoke $command
# exit if the testing failed
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
