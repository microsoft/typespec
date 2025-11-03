#Requires -Version 7.0
param(
    $filter,
    [bool]$Stubbed = $true,
    [bool]$LaunchOnly = $false,
    [bool]$GeneratePluginSample = $false
)

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force;
Import-Module "$PSScriptRoot\Spector-Helper.psm1" -DisableNameChecking -Force;

# Start overall timer
$totalStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$solutionDir = Join-Path $packageRoot 'generator'

if (-not $LaunchOnly) {
    Refresh-Build

    if ($GeneratePluginSample -and ($null -eq $filter -or $filter -eq "Sample-TypeSpec")) {

       Write-Host "Building logging plugin" -ForegroundColor Cyan
       $pluginDir = Join-Path $packageRoot '..' '..' 'docs' 'samples' 'client' 'csharp' 'plugins' 'logging' 'Logging.Plugin' 'src'
       Invoke "dotnet build" $pluginDir

       $sampleDir = Join-Path $packageRoot '..' '..' 'docs' 'samples' 'client' 'csharp' 'SampleService'

       Write-Host "Installing SampleTypeSpec plugins" -ForegroundColor Cyan

       Invoke "npm install --force" $sampleDir

       Write-Host "Generating SampleTypeSpec using plugins" -ForegroundColor Cyan

       Invoke "npx tsp compile . --trace @typespec/http-client-csharp --option @typespec/http-client-csharp.new-project=true" $sampleDir

       # exit if the generation failed
       if ($LASTEXITCODE -ne 0) {
         exit $LASTEXITCODE
       }

       Write-Host "Building SampleTypeSpec plugin library" -ForegroundColor Cyan
       Invoke "dotnet build $sampleDir/SampleClient/src/SampleTypeSpec.csproj"

       # exit if the generation failed
       if ($LASTEXITCODE -ne 0) {
         exit $LASTEXITCODE
       }

        Write-Host "Generating SampleTypeSpec" -ForegroundColor Cyan
        $testProjectsLocalDir = Join-Path $packageRoot 'generator' 'TestProjects' 'Local'

        $SampleTypeSpecTestProject = Join-Path $testProjectsLocalDir "Sample-TypeSpec"
        $SampleTypeSpecTestProject = $SampleTypeSpecTestProject

        Invoke (Get-TspCommand "$SampleTypeSpecTestProject/Sample-TypeSpec.tsp" $SampleTypeSpecTestProject)

        # exit if the generation failed
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }

        Write-Host "Building SampleTypeSpec" -ForegroundColor Cyan
        Invoke "dotnet build $packageRoot/generator/TestProjects/Local/Sample-TypeSpec/src/SampleTypeSpec.csproj"

        # exit if the generation failed
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}

$specsDirectory = "$packageRoot/node_modules/@typespec/http-specs"
$azureSpecsDirectory = "$packageRoot/node_modules/@azure-tools/azure-http-specs"
$spectorRoot = Join-Path $packageRoot 'generator' 'TestProjects' 'Spector'

$spectorLaunchProjects = @{}

foreach ($specFile in Get-Sorted-Specs) {
    $subPath = Get-SubPath $specFile
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    if (-not (Compare-Paths $subPath $filter)) {
        continue
    }
    $generationDir = Join-Path $spectorRoot $subPath

    # create the directory if it doesn't exist
    if (-not (Test-Path $generationDir)) {
        New-Item -ItemType Directory -Path $generationDir | Out-Null
    }

    Write-Host "Generating $subPath" -ForegroundColor Cyan
    
    if ($folders.Contains("versioning")) {
        Generate-Versioning (Split-Path $specFile) $generationDir -generateStub $stubbed
        $spectorLaunchProjects.Add($($folders -join "-") + "-v1", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v1")
        $spectorLaunchProjects.Add($($folders -join "-") + "-v2", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v2")
        continue
    }

    # srv-driven contains two separate specs, for two separate clients. We need to generate both.
    if ($folders.Contains("srv-driven")) {
        Generate-Srv-Driven (Split-Path $specFile) $generationDir -generateStub $stubbed
        $spectorLaunchProjects.Add($($folders -join "-") + "-v1", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v1")
        $spectorLaunchProjects.Add($($folders -join "-") + "-v2", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v2")
        continue
    }

    $spectorLaunchProjects.Add(($folders -join "-"), ("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))"))
    if ($LaunchOnly) {
        continue
    }
    
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
    $mtgExe = "`$(SolutionDir)/../dist/generator/Microsoft.TypeSpec.Generator.exe"
    $sampleSpec = "TestProjects/Local/Sample-TypeSpec"

    $launchSettings = @{}
    $launchSettings.Add("profiles", @{})
    $launchSettings["profiles"].Add("Sample-TypeSpec", @{})
    $launchSettings["profiles"]["Sample-TypeSpec"].Add("commandLineArgs", "`$(SolutionDir)/$sampleSpec -g ScmCodeModelGenerator")
    $launchSettings["profiles"]["Sample-TypeSpec"].Add("commandName", "Executable")
    $launchSettings["profiles"]["Sample-TypeSpec"].Add("executablePath", $mtgExe)
    $launchSettings["profiles"].Add("Sample-Service", @{})
    $launchSettings["profiles"]["Sample-Service"].Add("commandLineArgs", "`$(SolutionDir)/../../../docs/samples/client/csharp/SampleService/main.tsp -g ScmCodeModelGenerator")
    $launchSettings["profiles"]["Sample-Service"].Add("commandName", "Executable")
    $launchSettings["profiles"]["Sample-Service"].Add("executablePath", $mtgExe)

    foreach ($kvp in $spectorLaunchProjects.GetEnumerator()) {
        $launchSettings["profiles"].Add($kvp.Key, @{})
        $launchSettings["profiles"][$kvp.Key].Add("commandLineArgs", "`$(SolutionDir)/$($kvp.Value) -g StubLibraryGenerator")
        $launchSettings["profiles"][$kvp.Key].Add("commandName", "Executable")
        $launchSettings["profiles"][$kvp.Key].Add("executablePath", $mtgExe)
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
    Set-LaunchSettings $sortedLaunchSettings
}

# Stop total timer
$totalStopwatch.Stop()

# Display timing summary
Write-Host "`n==================== TIMING SUMMARY ====================" -ForegroundColor Cyan
Write-Host "Total execution time: $($totalStopwatch.Elapsed.ToString('hh\:mm\:ss\.ff'))" -ForegroundColor Yellow
