#Requires -Version 7.0
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$compare = Join-Path $PSScriptRoot '..' 'Compare-Generation.ps1'
$root = Join-Path ([IO.Path]::GetTempPath()) "compare-generation-$([Guid]::NewGuid())"
$global:compareGenerationTest = @{
    Calls = [Collections.Generic.List[string]]::new()
    Scenario = ''
    Library = ''
    Emitter = ''
    EmitterManifest = ''
}

function Get-EmitterManifest {
    $files = @(Get-ChildItem $global:compareGenerationTest.Emitter -File -Recurse -Force |
        Sort-Object FullName | ForEach-Object {
            [ordered]@{
                path = [IO.Path]::GetRelativePath($global:compareGenerationTest.Emitter, $_.FullName)
                hash = (Get-FileHash -LiteralPath $_.FullName).Hash
            }
        })
    return ConvertTo-Json -InputObject $files -Compress
}

function Assert-EmitterRestored {
    if ((Get-EmitterManifest) -cne $global:compareGenerationTest.EmitterManifest) {
        throw 'E2E comparison did not restore the pristine emitter directory.'
    }
}

function Invoke-FakeGeneration([string]$variant, [bool]$endToEnd) {
    if ($endToEnd) {
        $emitter = $global:compareGenerationTest.Emitter
        $other = if ($variant -eq 'baseline') { 'candidate' } else { 'baseline' }
        if ((Get-Content -Raw (Join-Path $emitter 'plugin.dll')).Trim() -ne 'same external plugin' -or
            (Get-Content -Raw (Join-Path $emitter 'plugins' 'nested.dll')).Trim() -ne 'nested external plugin' -or
            (Get-Content -Raw (Join-Path $emitter 'dependency.dll')).Trim() -ne 'same dependency' -or
            (Get-Content -Raw (Join-Path $emitter 'runtime.dll')).Trim() -ne $variant -or
            (Get-Content -Raw (Join-Path $emitter "$variant-only.dll")).Trim() -ne $variant -or
            (Get-Content -Raw (Join-Path $emitter 'resources' "$variant.txt")).Trim() -ne $variant -or
            (Test-Path -LiteralPath (Join-Path $emitter "$other-only.dll")) -or
            (Test-Path -LiteralPath (Join-Path $emitter 'resources' "$other.txt")) -or
            (Test-Path -LiteralPath (Join-Path $emitter 'generation.tmp'))) {
            throw 'E2E staging retained another build or failed to restore pristine plugins.'
        }
        Set-Content (Join-Path $emitter 'generation.tmp') $variant
        Set-Content (Join-Path $emitter 'plugin.dll') 'changed by generation'
    }
    $global:compareGenerationTest.Calls.Add($variant)
    $global:LASTEXITCODE = 0
    if ($global:compareGenerationTest.Scenario -eq 'exit') {
        $global:LASTEXITCODE = 7
        return
    }
    if ($global:compareGenerationTest.Scenario -ne 'empty') {
        $content = if ($global:compareGenerationTest.Scenario -eq 'output') { $variant } else { 'same generated output' }
        Set-Content (Join-Path $global:compareGenerationTest.Library 'src' 'Generated' 'Generated.txt') $content
    }
    if ($global:compareGenerationTest.Scenario -eq 'input') {
        Set-Content (Join-Path $global:compareGenerationTest.Library 'Configuration.json') '{"changed":true}'
    }
    if ($global:compareGenerationTest.Scenario -ne 'completion') {
        if ($endToEnd) {
            'trace @typespec/http-client-csharp.info: All files have been written to disk. Total Elapsed time: 00:00:00.001'
        }
        else {
            '{"method":"trace","params":{"message":"All files have been written to disk. Total Elapsed time: 00:00:00.001"}}'
        }
    }
}

function dotnet {
    Invoke-FakeGeneration (Get-Content -Raw $args[0]).Trim() $false
}

function tsp-client {
    foreach ($required in @('generate', '--skip-install', '--save-inputs', '--trace')) {
        if ($args -notcontains $required) {
            throw "Missing E2E argument: $required"
        }
        if ((Get-Location).Path -ne $global:compareGenerationTest.Library) {
            throw 'E2E generation did not run in the SDK library directory.'
        }
    }
    Invoke-FakeGeneration (Get-Content -Raw (Join-Path $global:compareGenerationTest.Emitter 'Microsoft.TypeSpec.Generator.dll')).Trim() $true
}

function New-Case([string]$name) {
    $global:compareGenerationTest.Scenario = $name
    $global:compareGenerationTest.Calls.Clear()
    $caseRoot = Join-Path $root "$name-$([Guid]::NewGuid())"
    $script:library = Join-Path $caseRoot 'library'
    $script:emitter = Join-Path $caseRoot 'emitter'
    $global:compareGenerationTest.Library = $library
    $global:compareGenerationTest.Emitter = $emitter
    foreach ($directory in @(
        (Join-Path $library 'src' 'Generated'),
        (Join-Path $emitter 'plugins'),
        (Join-Path $caseRoot 'baseline' 'resources'),
        (Join-Path $caseRoot 'candidate' 'resources')
    )) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    foreach ($name in @('tspCodeModel.json', 'Configuration.json')) {
        Set-Content (Join-Path $library $name) '{}'
    }
    foreach ($variant in @('baseline', 'candidate')) {
        Set-Content (Join-Path $caseRoot $variant 'Microsoft.TypeSpec.Generator.dll') $variant
        Set-Content (Join-Path $caseRoot $variant 'dependency.dll') 'same dependency'
        Set-Content (Join-Path $caseRoot $variant 'runtime.dll') $variant
        Set-Content (Join-Path $caseRoot $variant "$variant-only.dll") $variant
        Set-Content (Join-Path $caseRoot $variant 'resources' "$variant.txt") $variant
    }
    Set-Content (Join-Path $emitter 'Microsoft.TypeSpec.Generator.dll') 'original generator'
    Set-Content (Join-Path $emitter 'runtime.dll') 'original runtime'
    Set-Content (Join-Path $emitter 'plugin.dll') 'same external plugin'
    Set-Content (Join-Path $emitter 'plugins' 'nested.dll') 'nested external plugin'
    $global:compareGenerationTest.EmitterManifest = Get-EmitterManifest
    return @{
        BaselineGenerator = Join-Path $caseRoot 'baseline' 'Microsoft.TypeSpec.Generator.dll'
        CandidateGenerator = Join-Path $caseRoot 'candidate' 'Microsoft.TypeSpec.Generator.dll'
        LibraryDirectory = $library
        ResultDirectory = Join-Path $caseRoot 'results'
        Iterations = 2
    }
}

function Assert-Failure([string]$scenario, [string]$message, [bool]$endToEnd = $false) {
    $parameters = New-Case $scenario
    if ($endToEnd) {
        $parameters.EmitterGeneratorDirectory = $emitter
    }
    else {
        $parameters.GeneratorName = 'TestGenerator'
    }
    try {
        & $compare @parameters | Out-Null
    }
    catch {
        if ($_.Exception.Message -notlike "*$message*") {
            throw "Unexpected failure for ${scenario}: $($_.Exception.Message)"
        }
        if ($endToEnd) {
            Assert-EmitterRestored
        }
        return
    }
    throw "Expected failure for $scenario"
}

function Assert-InvalidStaging([string]$scenario) {
    $parameters = New-Case $scenario
    $buildDirectory = Split-Path $parameters.BaselineGenerator
    $parameters.EmitterGeneratorDirectory = switch ($scenario) {
        'same-build' { $buildDirectory }
        'build-parent' { Split-Path $buildDirectory }
        'build-child' { Join-Path $buildDirectory 'staging' }
        'same-results' { $parameters.ResultDirectory }
        'results-child' { Join-Path $parameters.ResultDirectory 'staging' }
        'results-parent' { $emitter }
        'root' { [IO.Path]::GetPathRoot($emitter) }
    }
    if ($scenario -eq 'results-parent') {
        $parameters.ResultDirectory = Join-Path $emitter 'results'
    }
    New-Item -ItemType Directory -Path $parameters.EmitterGeneratorDirectory -Force | Out-Null
    $originalBuildHash = (Get-FileHash -LiteralPath $parameters.BaselineGenerator).Hash
    $message = if ($scenario -eq 'root') { 'cannot be a filesystem root' } else { 'must be separate' }
    try {
        & $compare @parameters | Out-Null
    }
    catch {
        if ($_.Exception.Message -notlike "*$message*" -or
            $global:compareGenerationTest.Calls.Count -ne 0 -or
            (Get-FileHash -LiteralPath $parameters.BaselineGenerator).Hash -ne $originalBuildHash) {
            throw "Staging isolation failed for ${scenario}: $($_.Exception.Message)"
        }
        return
    }
    throw "Expected staging rejection for $scenario"
}

function Assert-SnapshotPlacement([string]$scenario, [bool]$reject) {
    $parameters = New-Case $scenario
    $parameters.EmitterGeneratorDirectory = $emitter
    $temporaryDirectory = switch ($scenario) {
        'snapshot-same' { $emitter }
        'snapshot-child' { Join-Path $emitter 'temp' }
        'snapshot-trailing' { "$(Join-Path $emitter 'temp')$([IO.Path]::DirectorySeparatorChar)" }
        'snapshot-sibling' { "$emitter-temp" }
        'snapshot-create-failure' { "$emitter-temp" }
    }
    if ($scenario -eq 'snapshot-trailing') {
        $parameters.EmitterGeneratorDirectory += [IO.Path]::DirectorySeparatorChar
    }
    New-Item -ItemType Directory -Path $temporaryDirectory -Force | Out-Null
    $sentinel = Join-Path $temporaryDirectory 'sentinel.txt'
    Set-Content -LiteralPath $sentinel 'retain temporary contents'
    $global:compareGenerationTest.EmitterManifest = Get-EmitterManifest
    $originalEnvironment = @{}
    function New-Item {
        [CmdletBinding()]
        param([string]$Path, [string]$ItemType, [switch]$Force)
        if ($reject -and (Split-Path -Leaf $Path) -like 'compare-generation-emitter-*') {
            throw 'Unsafe snapshot creation was attempted.'
        }
        if ($scenario -eq 'snapshot-create-failure' -and (Split-Path -Leaf $Path) -like 'compare-generation-emitter-*') {
            throw 'Snapshot creation failed for test.'
        }
        Microsoft.PowerShell.Management\New-Item @PSBoundParameters
    }
    try {
        foreach ($name in @('TEMP', 'TMP', 'TMPDIR')) {
            $originalEnvironment[$name] = [Environment]::GetEnvironmentVariable($name)
            [Environment]::SetEnvironmentVariable($name, $temporaryDirectory)
        }
        if ([IO.Path]::TrimEndingDirectorySeparator([IO.Path]::GetTempPath()) -ne
            [IO.Path]::TrimEndingDirectorySeparator($temporaryDirectory)) {
            throw 'Snapshot placement test did not use its isolated temporary directory.'
        }
        $rejected = $false
        $expectedFailure = $reject -or $scenario -eq 'snapshot-create-failure'
        $expectedMessage = if ($reject) { '*must be separate*' } else { '*Snapshot creation failed for test.*' }
        try {
            & $compare @parameters | Out-Null
        }
        catch {
            if (-not $expectedFailure -or $_.Exception.Message -notlike $expectedMessage) {
                throw "Unexpected snapshot placement failure for ${scenario}: $($_.Exception.Message)"
            }
            $rejected = $true
        }
        if ($expectedFailure -and (-not $rejected -or $global:compareGenerationTest.Calls.Count -ne 0)) {
            throw "Snapshot placement failure was not reported before generation: $scenario"
        }
        Assert-EmitterRestored
        if ((Get-Content -LiteralPath $sentinel -Raw).Trim() -ne 'retain temporary contents' -or
            @(Get-ChildItem -LiteralPath $temporaryDirectory -Directory -Filter 'compare-generation-emitter-*').Count -ne 0) {
            throw "Snapshot placement changed temporary contents or leaked a snapshot: $scenario"
        }
    }
    finally {
        foreach ($name in $originalEnvironment.Keys) {
            [Environment]::SetEnvironmentVariable($name, $originalEnvironment[$name])
        }
    }
}

try {
    $parameters = New-Case 'generator'
    $parameters.GeneratorName = 'TestGenerator'
    & $compare @parameters | Out-Null
    $results = Get-Content -Raw (Join-Path $parameters.ResultDirectory 'results.json') | ConvertFrom-Json
    if ($results.measurement -ne 'csharp-generation' -or
        $results.warmupsPerBuild -ne 1 -or $results.iterationsPerBuild -ne 2 -or
        ($global:compareGenerationTest.Calls -join ',') -ne 'baseline,candidate,candidate,baseline,baseline,candidate' -or
        $results.results[0].samples.Count -ne 2 -or $results.results[1].samples.Count -ne 2) {
        throw 'Generator mode did not preserve the warmup, measured samples and alternating order.'
    }
    foreach ($result in $results.results) {
        $times = @($result.samples.wallMilliseconds | Sort-Object)
        if ($result.medianWallMilliseconds -ne ($times[0] + $times[1]) / 2) {
            throw 'Incorrect even-sample median.'
        }
    }

    $parameters = New-Case 'defaults'
    $parameters.GeneratorName = 'TestGenerator'
    $parameters.Remove('Iterations')
    & $compare @parameters | Out-Null
    $results = Get-Content -Raw (Join-Path $parameters.ResultDirectory 'results.json') | ConvertFrom-Json
    if ($global:compareGenerationTest.Calls.Count -ne 12 -or $results.iterationsPerBuild -ne 5) {
        throw 'Default comparison must run one warmup and five measured runs per build.'
    }
    foreach ($result in $results.results) {
        $times = @($result.samples.wallMilliseconds | Sort-Object)
        if ($result.medianWallMilliseconds -ne $times[2]) {
            throw 'Incorrect odd-sample median.'
        }
    }

    $parameters = New-Case 'end-to-end'
    $parameters.EmitterGeneratorDirectory = $emitter
    & $compare @parameters | Out-Null
    Assert-EmitterRestored
    $results = Get-Content -Raw (Join-Path $parameters.ResultDirectory 'results.json') | ConvertFrom-Json
    if ($results.measurement -ne 'typespec-to-csharp' -or
        ($global:compareGenerationTest.Calls -join ',') -ne 'baseline,candidate,candidate,baseline,baseline,candidate' -or
        (Get-Content -Raw (Join-Path $emitter 'plugin.dll')).Trim() -ne 'same external plugin' -or
        $results.results[0].samples[0].stages.'All files have been written to disk' -ne 1) {
        throw 'E2E mode did not stage the correct binaries, preserve plugins or capture trace stages.'
    }

    Assert-Failure 'exit' 'Generation failed (7)'
    Assert-Failure 'exit' 'Generation failed (7)' $true
    Assert-Failure 'completion' 'Generation did not report completion'
    Assert-Failure 'completion' 'Generation did not report completion' $true
    Assert-Failure 'empty' 'No generated files found'
    Assert-Failure 'output' 'Generated output differs'
    Assert-Failure 'input' 'Saved generator inputs changed'
    Assert-Failure 'empty' 'No generated files found' $true
    Assert-Failure 'output' 'Generated output differs' $true
    Assert-Failure 'input' 'Saved generator inputs changed' $true
    foreach ($scenario in @('same-build', 'build-parent', 'build-child', 'same-results', 'results-parent', 'results-child', 'root')) {
        Assert-InvalidStaging $scenario
    }
    foreach ($scenario in @('snapshot-same', 'snapshot-child', 'snapshot-trailing')) {
        Assert-SnapshotPlacement $scenario $true
    }
    Assert-SnapshotPlacement 'snapshot-sibling' $false
    Assert-SnapshotPlacement 'snapshot-create-failure' $false
    Write-Output 'Compare-Generation tests passed (generator/E2E modes, staging/snapshot isolation, restoration, medians and twenty-one failure cases).'
}
finally {
    Remove-Variable -Name compareGenerationTest -Scope Global
    if (Test-Path -LiteralPath $root) {
        Remove-Item -LiteralPath $root -Recurse -Force
    }
}
