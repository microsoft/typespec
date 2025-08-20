#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;
Import-Module "$PSScriptRoot\Spector-Helper.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Refresh-Build

$spectorRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'Spector' 'http'
$testDirectories = Get-ChildItem -Path "$spectorRoot" -Directory -Recurse
$spectorCsproj = Join-Path $packageRoot 'generator' 'TestProjects' 'Spector.Tests' 'TestProjects.Spector.Tests.csproj'

$coverageDir = Join-Path $packageRoot 'generator' 'artifacts' 'coverage'

if (-not (Test-Path $coverageDir)) {
    New-Item -ItemType Directory -Path $coverageDir | Out-Null
}

$failingSpecs = @(
)

# generate all
foreach ($directory in Get-Sorted-Specs) {
    $subPath = Get-SubPath $directory
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    Write-Host "Regenerating $subPath" -ForegroundColor Cyan
    
    if ($subPath.Contains("versioning")) {
        if ($subPath.Contains("v1")) {
            # this will generate v1 and v2 so we only need to call it once for one of the versions
            Generate-Versioning (directory | Split-Path) $($outputDir | Split-Path) -createOutputDirIfNotExist $false
        }
        continue
    }

    if ($subPath.Contains("srv-driven")) {
        if ($subPath.Contains("v1")) {
            # this will generate v1 and v2 so we only need to call it once for one of the versions
            Generate-Srv-Driven (directory| Split-Path) $($outputDir | Split-Path) -createOutputDirIfNotExist $false
        }
        continue
    }

    $outputDir = $spectorRoot
    foreach ($folder in $folders) {
      $outputDir = Join-Path $outputDir $folder
    }
    $command = Get-TspCommand $specFile $outputDir
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    # build the generated project
    Write-Host "Building $subPath" -ForegroundColor Cyan
    Get-ChildItem -Path $outputDir -Recurse -Filter '*.csproj' | ForEach-Object {
        $command = "dotnet build $_"
        Invoke $command
        # exit if the build failed
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}

# test all
Write-Host "Generating Spector coverage" -ForegroundColor Cyan
$command  = "dotnet test $spectorCsproj"
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
    $subPath = $outputDir.Substring($spectorRoot.Length + 1)

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
