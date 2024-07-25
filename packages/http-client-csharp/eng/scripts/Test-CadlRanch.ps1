# cspell:ignore cadlranch

#Requires -Version 7.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

Refresh-Build

$specsDirectory = "$packageRoot/node_modules/@azure-tools/cadl-ranch-specs"
$cadlRanchRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch'
$directories = Get-ChildItem -Path "$cadlRanchRoot" -Directory -Recurse
$cadlRanchCsproj = Join-Path $packageRoot 'generator' 'TestProjects' 'CadlRanch.Tests' 'TestProjects.CadlRanch.Tests.csproj'
$runSettings = Join-Path $packageRoot 'eng' 'test-configurations' 'cadlranch.runsettings'

function IsGenerated {
    param (
        [string]$dir
    )

    if (-not ($dir.EndsWith("Generated"))) {
        return $false
    }

    $csFiles = Get-ChildItem -Path $directory -Filter *.cs -File
    return $csFiles.Count -gt 0
}

function Capitalize-FirstLetter {
    param (
        [string]$inputString
    )

    if ([string]::IsNullOrEmpty($inputString)) {
        return $inputString
    }

    $firstChar = $inputString[0].ToString().ToUpper()
    $restOfString = $inputString.Substring(1)

    return $firstChar + $restOfString
}

function Get-Namespace {
    param (
        [string]$dir
    )

    $words = $dir.Split('-')
    $namespace = ""
    foreach ($word in $words) {
        $namespace += Capitalize-FirstLetter $word
    }
    return $namespace
}

foreach ($directory in $directories) {
    if (-not (IsGenerated $directory.FullName)) {
        continue
    }

    $outputDir = $directory.FullName.Substring(0, $directory.FullName.IndexOf("src") - 1)
    $subPath = $outputDir.Substring($cadlRanchRoot.Length + 1)
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    $testFilter = "TestProjects.CadlRanch.Tests"
    foreach ($folder in $folders) {
        $testFilter += ".$(Get-Namespace $folder)"
    }

    Write-Host "Regenerating $subPath" -ForegroundColor Cyan

    $specFile = Join-Path $specsDirectory $subPath "main.tsp"

    $command = Get-TspCommand $specFile $outputDir
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Write-Host "Testing $subPath" -ForegroundColor Cyan
    $command  = "dotnet test $cadlRanchCsproj --filter `"FullyQualifiedName~$testFilter`" --settings $runSettings"
    Invoke $command
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

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
