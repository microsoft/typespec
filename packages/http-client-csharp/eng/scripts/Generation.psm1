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

    $v1Dir = $(Join-Path $outputDir "v1")
    if ($createOutputDirIfNotExist -and -not (Test-Path $v1Dir)) {
        New-Item -ItemType Directory -Path $v1Dir | Out-Null
    }

    $v2Dir = $(Join-Path $outputDir "v2")
    if ($createOutputDirIfNotExist -and -not (Test-Path $v2Dir)) {
        New-Item -ItemType Directory -Path $v2Dir | Out-Null
    }

    ## get the last two directories of the output directory and add V1/V2 to disambiguate the namespaces
    $namespaceRoot = $(($outputDir.Split([System.IO.Path]::DirectorySeparatorChar)[-2..-1] | `
        ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -replace '-(\p{L})', { $_.Groups[1].Value.ToUpper() } -replace '\W', '' -join ".")
    $v1NamespaceOverride = $namespaceRoot + ".V1" 
    $v2NamespaceOverride = $namespaceRoot + ".V2"

    $v1SpecFilePath = $(Join-Path $specFilePath "old.tsp")
    $v2SpecFilePath = $(Join-Path $specFilePath "main.tsp")

    Invoke (Get-TspCommand $v1SpecFilePath $v1Dir -generateStub $generateStub -namespaceOverride $v1NamespaceOverride)
    Invoke (Get-TspCommand $v2SpecFilePath $v2Dir -generateStub $generateStub -namespaceOverride $v2NamespaceOverride)

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
