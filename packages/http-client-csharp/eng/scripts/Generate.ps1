#Requires -Version 7.0
param(
    $filter,
    [bool]$Stubbed = $true,
    [bool]$LaunchOnly = $false
)

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$solutionDir = Join-Path $packageRoot 'generator'

if (-not $LaunchOnly) {
    Refresh-Build

    if ($null -eq $filter -or $filter -eq "Unbranded-TypeSpec") {
        Write-Host "Generating UnbrandedTypeSpec" -ForegroundColor Cyan
        $testProjectsLocalDir = Join-Path $packageRoot 'generator' 'TestProjects' 'Local'

        $unbrandedTypespecTestProject = Join-Path $testProjectsLocalDir "Unbranded-TypeSpec"
        $unbrandedTypespecTestProject = $unbrandedTypespecTestProject

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
    }
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
    Join-Path 'http' 'client' 'structure' 'default'
    Join-Path 'http' 'client' 'structure' 'client-operation-group'
    Join-Path 'http' 'client' 'structure' 'renamed-operation'
    Join-Path 'http' 'client' 'structure' 'two-operation-group'
    Join-Path 'http' 'encode' 'numeric'
    Join-Path 'http' 'parameters' 'body-optionality'
    Join-Path 'http' 'parameters' 'collection-format'
    Join-Path 'http' 'parameters' 'spread'
    Join-Path 'http' 'payload' 'content-negotiation'
    Join-Path 'http' 'payload' 'json-merge-patch'
    Join-Path 'http' 'payload' 'pageable'
    Join-Path 'http' 'resiliency' 'srv-driven'
    Join-Path 'http' 'routes'
    Join-Path 'http' 'serialization' 'encoded-name' 'json'
    Join-Path 'http' 'server' 'endpoint' 'not-defined'
    Join-Path 'http' 'server' 'path' 'multiple'
    Join-Path 'http' 'server' 'path' 'single'
    Join-Path 'http' 'server' 'versions' 'versioned'
    Join-Path 'http' 'special-headers' 'conditional-request'
    Join-Path 'http' 'special-headers' 'repeatability'
    Join-Path 'http' 'type' 'model' 'flatten'
    Join-Path 'http' 'type' 'model' 'visibility'
    Join-Path 'http' 'type' 'model' 'inheritance' 'nested-discriminator'
    Join-Path 'http' 'type' 'model' 'inheritance' 'not-discriminated'
    Join-Path 'http' 'type' 'model' 'inheritance' 'recursive'
    Join-Path 'http' 'type' 'model' 'templated'
)

$cadlRanchLaunchProjects = @{}

# Loop through all directories and subdirectories of the cadl ranch specs
$directories = Get-ChildItem -Path "$specsDirectory/http" -Directory -Recurse
foreach ($directory in $directories) {
    if (-not (IsSpecDir $directory.FullName)) {
        continue
    }

    $specFile = Join-Path $directory.FullName "client.tsp"
    if (-not (Test-Path $specFile)) {
        $specFile = Join-Path $directory.FullName "main.tsp"
    }
    $subPath = $directory.FullName.Substring($specsDirectory.Length + 1)
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    if (-not (Compare-Paths $subPath $filter)) {
        continue
    }

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

    $cadlRanchLaunchProjects.Add(($folders -join "-"), ("TestProjects/CadlRanch/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))"))
    if ($LaunchOnly) {
        continue
    }
    Write-Host "Generating $subPath" -ForegroundColor Cyan
    Invoke (Get-TspCommand $specFile $generationDir $stubbed)

    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    # TODO need to build but depends on https://github.com/Azure/autorest.csharp/issues/4463
}

# only write new launch settings if no filter was passed in
if ($null -eq $filter) {
    Write-Host "Writing new launch settings" -ForegroundColor Cyan
    $mgcExe = "`$(SolutionDir)/../dist/generator/Microsoft.Generator.CSharp.exe"
    $sampleExe = "`$(SolutionDir)/../generator/artifacts/bin/SamplePlugin/Debug/net8.0/Microsoft.Generator.CSharp.exe"
    $unbrandedSpec = "TestProjects/Local/Unbranded-TypeSpec"
    $unbrandedPluginSpec = "TestProjects/Plugin/Unbranded-TypeSpec"

    $launchSettings = @{}
    $launchSettings.Add("profiles", @{})
    $launchSettings["profiles"].Add("Unbranded-TypeSpec", @{})
    $launchSettings["profiles"]["Unbranded-TypeSpec"].Add("commandLineArgs", "`$(SolutionDir)/$unbrandedSpec -p ClientModelPlugin")
    $launchSettings["profiles"]["Unbranded-TypeSpec"].Add("commandName", "Executable")
    $launchSettings["profiles"]["Unbranded-TypeSpec"].Add("executablePath", $mgcExe)
    $launchSettings["profiles"].Add("Debug-Plugin-Test-TypeSpec", @{})
    $launchSettings["profiles"]["Debug-Plugin-Test-TypeSpec"].Add("commandLineArgs", "`$(SolutionDir)/$unbrandedPluginSpec -p SampleCodeModelPlugin")
    $launchSettings["profiles"]["Debug-Plugin-Test-TypeSpec"].Add("commandName", "Executable")
    $launchSettings["profiles"]["Debug-Plugin-Test-TypeSpec"].Add("executablePath", $sampleExe)

    foreach ($kvp in $cadlRanchLaunchProjects.GetEnumerator()) {
        $launchSettings["profiles"].Add($kvp.Key, @{})
        $launchSettings["profiles"][$kvp.Key].Add("commandLineArgs", "`$(SolutionDir)/$($kvp.Value) -p StubLibraryPlugin")
        $launchSettings["profiles"][$kvp.Key].Add("commandName", "Executable")
        $launchSettings["profiles"][$kvp.Key].Add("executablePath", $mgcExe)
    }

    $sortedLaunchSettings = @{}
    $sortedLaunchSettings.Add("profiles", [ordered]@{})
    $launchSettings["profiles"].Keys | Sort-Object | ForEach-Object {
        $profileKey = $_
        $originalProfile = $launchSettings["profiles"][$profileKey]

        # Sort the keys inside each profile
        # This is needed due to non deterministic ordering of json elements in powershell
        $sortedProfile = [ordered]@{}
        $originalProfile.GetEnumerator() | Sort-Object Key | ForEach-Object {
            $sortedProfile[$_.Key] = $_.Value
        }

        $sortedLaunchSettings["profiles"][$profileKey] = $sortedProfile
    }

    # Write the launch settings to the launchSettings.json file
    $launchSettingsPath = Join-Path $solutionDir "Microsoft.Generator.CSharp" "src" "Properties" "launchSettings.json"
    $sortedLaunchSettings | ConvertTo-Json | Set-Content $launchSettingsPath
}
