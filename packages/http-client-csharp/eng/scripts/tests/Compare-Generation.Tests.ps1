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
}

function Invoke-FakeGeneration([string]$variant, [bool]$endToEnd) {
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
        $emitter,
        (Join-Path $caseRoot 'baseline'),
        (Join-Path $caseRoot 'candidate')
    )) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    foreach ($name in @('tspCodeModel.json', 'Configuration.json')) {
        Set-Content (Join-Path $library $name) '{}'
    }
    foreach ($variant in @('baseline', 'candidate')) {
        Set-Content (Join-Path $caseRoot $variant 'Microsoft.TypeSpec.Generator.dll') $variant
        Set-Content (Join-Path $caseRoot $variant 'dependency.dll') 'same dependency'
    }
    Set-Content (Join-Path $emitter 'plugin.dll') 'same external plugin'
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
        return
    }
    throw "Expected failure for $scenario"
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
    Write-Output 'Compare-Generation tests passed (generator/E2E modes, medians and ten failure cases).'
}
finally {
    Remove-Variable -Name compareGenerationTest -Scope Global
    if (Test-Path -LiteralPath $root) {
        Remove-Item -LiteralPath $root -Recurse -Force
    }
}
