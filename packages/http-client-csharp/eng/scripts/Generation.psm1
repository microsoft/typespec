$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Invoke($command, $executePath=$repoRoot)
{
    Write-Host "> $command"
    Push-Location $executePath
    if ($IsLinux -or $IsMacOs)
    {
        sh -c "$command 2>&1"
    }
    else
    {
        cmd /c "$command 2>&1"
    }
    Pop-Location

    if($LastExitCode -ne 0)
    {
        Write-Error "Command failed to execute: $command"
    }
}

function Get-TspCommand {
    param (
        [string]$specFile,
        [string]$generationDir,
        [bool]$generateStub = $false,
        [string]$namespaceOverride = $null
    )
    $command = "npx tsp compile $specFile"
    $command += " --trace @typespec/http-client-csharp"
    $command += " --emit @typespec/http-client-csharp"
    $configFile = Join-Path $generationDir "tspconfig.yaml"
    if (Test-Path $configFile) {
        $command += " --config=$configFile"
    }
    $command += " --option @typespec/http-client-csharp.emitter-output-dir=$generationDir"
    $command += " --option @typespec/http-client-csharp.save-inputs=true"
    if ($generateStub) {
        $command += " --option @typespec/http-client-csharp.plugin-name=StubLibraryPlugin"
    }

    if ($namespaceOverride) {
        $command += " --option @typespec/http-client-csharp.namespace=$namespaceOverride"
    }

    return $command
}

function Refresh-Build {
    Write-Host "Building emitter and generator" -ForegroundColor Cyan
    Invoke "npm run build:emitter"
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    # we don't want to build the entire solution because the test projects might not build until after regeneration
    # generating Microsoft.Generator.CSharp.ClientModel.csproj is enough
    Invoke "dotnet build $repoRoot/../generator/Microsoft.Generator.CSharp.ClientModel.StubLibrary/src"
    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Compare-Paths {
    param (
        [string]$path1,
        [string]$path2
    )

    # Normalize the directory separators
    $normalizedPath1 = $path1 -replace '/', '\'
    $normalizedPath2 = $path2 -replace '/', '\'

    # Compare the normalized paths
    return $normalizedPath1.Contains($normalizedPath2)
}

function Generate-Srv-Driven {
    param (
      [string]$specFilePath,
      [string]$outputDir,
      [bool]$generateStub = $false,
      [bool]$createOutputDirIfNotExist = $true
    )

    $specFilePath = $(Join-Path $specFilePath "old.tsp")
    $outputDir = $(Join-Path $outputDir "v1")
    if ($createOutputDirIfNotExist -and -not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }

    Write-Host "Generating http\resiliency\srv-driven\v1" -ForegroundColor Cyan
    Invoke (Get-TspCommand $specFilePath $outputDir -generateStub $generateStub -namespaceOverride "Resiliency.ServiceDriven.V1")

    # exit if the generation failed
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}


Export-ModuleMember -Function "Invoke"
Export-ModuleMember -Function "Get-TspCommand"
Export-ModuleMember -Function "Refresh-Build"
Export-ModuleMember -Function "Compare-Paths"
Export-ModuleMember -Function "Generate-Srv-Driven"
