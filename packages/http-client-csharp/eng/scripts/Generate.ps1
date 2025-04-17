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

    if ($null -eq $filter -or $filter -eq "Sample-TypeSpec") {

        Write-Host "Building logging plugin" -ForegroundColor Cyan
        $pluginDir = Join-Path $packageRoot '..' '..' 'docs' 'samples' 'client' 'csharp' 'plugins' 'logging' 'Logging.Plugin' 'src'
        Invoke "dotnet build" $pluginDir

        $sampleDir = Join-Path $packageRoot '..' '..' 'docs' 'samples' 'client' 'csharp' 'SampleService'

        Write-Host "Installing SampleTypeSpec plugins" -ForegroundColor Cyan
       
        Invoke "npm install" $sampleDir

        Write-Host "Generating SampleTypeSpec using plugins" -ForegroundColor Cyan
  
        Invoke "npx tsp compile . --trace @typespec/http-client-csharp" $sampleDir

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

        Invoke (Get-TspCommand "$SampleTypeSpecTestProject/Sample-TypeSpec.tsp" $SampleTypeSpecTestProject -newProject $false)

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

function IsSpecDir {
    param (
        [string]$dir
    )
    $subdirs = Get-ChildItem -Path $dir -Directory
    return -not ($subdirs) -and (Test-Path "$dir/main.tsp")
}

$failingSpecs = @(
    Join-Path 'http' 'payload' 'xml'
    Join-Path 'http' 'type' 'model' 'flatten'
    Join-Path 'http' 'type' 'model' 'templated'
    Join-Path 'http' 'client' 'naming' # pending until https://github.com/microsoft/typespec/issues/5653 is resolved
    Join-Path 'http' 'streaming' 'jsonl'
)

$azureAllowSpecs = @(
    Join-Path 'http' 'client' 'structure' 'client-operation-group'
    Join-Path 'http' 'client' 'structure' 'default'
    Join-Path 'http' 'client' 'structure' 'multi-client'
    Join-Path 'http' 'client' 'structure' 'renamed-operation'
    Join-Path 'http' 'client' 'structure' 'two-operation-group'
    Join-Path 'http' 'resiliency' 'srv-driven'
)

$spectorLaunchProjects = @{}

# Loop through all directories and subdirectories of the Spector specs
$directories = @(Get-ChildItem -Path "$specsDirectory/specs" -Directory -Recurse)
$directories += @(Get-ChildItem -Path "$azureSpecsDirectory/specs" -Directory -Recurse)
foreach ($directory in $directories) {
    if (-not (IsSpecDir $directory.FullName)) {
        continue
    }

    $fromAzure = $directory.FullName.Contains("azure-http-specs")

    $specFile = Join-Path $directory.FullName "client.tsp"
    if (-not (Test-Path $specFile)) {
        $specFile = Join-Path $directory.FullName "main.tsp"
    }
    $subPath = if ($fromAzure) {$directory.FullName.Substring($azureSpecsDirectory.Length + 1)} else {$directory.FullName.Substring($specsDirectory.Length + 1)}
    $subPath = $subPath -replace '^specs', 'http' # Keep consistent with the previous folder name because 'http' makes more sense then current 'specs'
    $folders = $subPath.Split([System.IO.Path]::DirectorySeparatorChar)

    if (-not (Compare-Paths $subPath $filter)) {
        continue
    }

    if ($fromAzure -eq $true -and !$azureAllowSpecs.Contains($subPath)) {
        continue
    }

    if ($failingSpecs.Contains($subPath)) {
        Write-Host "Skipping $subPath" -ForegroundColor Yellow
        continue
    }

    $generationDir = $spectorRoot
    foreach ($folder in $folders) {
        $generationDir = Join-Path $generationDir $folder
    }

    # create the directory if it doesn't exist
    if (-not (Test-Path $generationDir)) {
        New-Item -ItemType Directory -Path $generationDir | Out-Null
    }
    
    if ($folders.Contains("versioning")) {
        Write-Host "Generating versioning for $subPath" -ForegroundColor Cyan
        Generate-Versioning $directory.FullName $generationDir -generateStub $stubbed
        $spectorLaunchProjects.Add($($folders -join "-") + "-v1", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v1")
        $spectorLaunchProjects.Add($($folders -join "-") + "-v2", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v2")
        continue
    }

    # srv-driven contains two separate specs, for two separate clients. We need to generate both.
    if ($folders.Contains("srv-driven")) {
        Generate-Srv-Driven $directory.FullName $generationDir -generateStub $stubbed
        $spectorLaunchProjects.Add($($folders -join "-") + "-v1", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v1")
        $spectorLaunchProjects.Add($($folders -join "-") + "-v2", $("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))") + "/v2")
        continue
    }

    $spectorLaunchProjects.Add(($folders -join "-"), ("TestProjects/Spector/$($subPath.Replace([System.IO.Path]::DirectorySeparatorChar, '/'))"))
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
    $launchSettingsPath = Join-Path $solutionDir "Microsoft.TypeSpec.Generator" "src" "Properties" "launchSettings.json"
    # Write the settings to JSON and normalize line endings to Unix style (LF)
    $sortedLaunchSettings | ConvertTo-Json | ForEach-Object { ($_ -replace "`r`n", "`n") + "`n" } | Set-Content -NoNewLine $launchSettingsPath
}
