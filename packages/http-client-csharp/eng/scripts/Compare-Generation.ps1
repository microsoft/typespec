#Requires -Version 7.0
<#
.SYNOPSIS
Compares two generator builds using saved inputs or full TypeSpec-to-C# SDK generation.

.DESCRIPTION
Run tsp-client sync and tsp-client generate --save-inputs in an isolated SDK worktree first.
Both generators must have matching plugin/dependency assemblies. For full pipeline timing,
pass EmitterGeneratorDirectory from an isolated, installed emitter package. Each build's
complete directory is staged there before running tsp-client generate --skip-install.
Staging, dependency installation and spec synchronization are outside the timed region.
Each build gets one warmup,
then measured runs alternate their order. Every run must produce byte-identical files under
src/Generated. Saved-input mode excludes TypeSpec compilation. Point configured plugins
at prebuilt assemblies; any build hooks invoked by the emitter remain part of E2E timing.
#>
[CmdletBinding(DefaultParameterSetName = 'Generator')]
param(
    [Parameter(Mandatory)][string]$BaselineGenerator,
    [Parameter(Mandatory)][string]$CandidateGenerator,
    [Parameter(Mandatory)][string]$LibraryDirectory,
    [Parameter(Mandatory, ParameterSetName = 'Generator')][string]$GeneratorName,
    [Parameter(Mandatory, ParameterSetName = 'EndToEnd')][string]$EmitterGeneratorDirectory,
    [Parameter(Mandatory)][string]$ResultDirectory,
    [ValidateRange(1, 100)][int]$Iterations = 5
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$generators = [ordered]@{
    baseline = (Resolve-Path $BaselineGenerator).Path
    candidate = (Resolve-Path $CandidateGenerator).Path
}
$LibraryDirectory = (Resolve-Path $LibraryDirectory).Path
$endToEnd = $PSCmdlet.ParameterSetName -eq 'EndToEnd'
if ($endToEnd) {
    $EmitterGeneratorDirectory = (Resolve-Path $EmitterGeneratorDirectory).Path
    foreach ($generator in $generators.Values) {
        if ([IO.Path]::GetDirectoryName($generator) -eq $EmitterGeneratorDirectory) {
            throw 'Emitter staging directory must be separate from both generator builds.'
        }
    }
}
$generatedDirectory = Join-Path $LibraryDirectory 'src' 'Generated'
$inputFiles = @('tspCodeModel.json', 'Configuration.json')
$inputHashes = @($inputFiles | ForEach-Object {
    (Get-FileHash (Join-Path $LibraryDirectory $_) -Algorithm SHA256).Hash
})
New-Item -ItemType Directory -Path $ResultDirectory -Force | Out-Null
$ResultDirectory = (Resolve-Path $ResultDirectory).Path
$samples = @{ baseline = @(); candidate = @() }
$expected = $null

for ($iteration = 0; $iteration -le $Iterations; $iteration++) {
    $order = if ($iteration % 2 -eq 0) { @('baseline', 'candidate') } else { @('candidate', 'baseline') }
    foreach ($variant in $order) {
        $log = Join-Path $ResultDirectory "$variant-$iteration.log"
        if ($endToEnd) {
            Get-ChildItem ([IO.Path]::GetDirectoryName($generators[$variant])) -Force |
                Copy-Item -Destination $EmitterGeneratorDirectory -Recurse -Force
            $stagedGenerator = Join-Path $EmitterGeneratorDirectory ([IO.Path]::GetFileName($generators[$variant]))
            if ((Get-FileHash $stagedGenerator).Hash -ne (Get-FileHash $generators[$variant]).Hash) {
                throw "Staged generator does not match $variant build."
            }
        }
        $timer = [System.Diagnostics.Stopwatch]::StartNew()
        if ($endToEnd) {
            Push-Location $LibraryDirectory
            try {
                & tsp-client generate --skip-install --save-inputs --trace '@typespec/http-client-csharp' *> $log
                $exitCode = $LASTEXITCODE
            }
            finally {
                Pop-Location
            }
        }
        else {
            & dotnet $generators[$variant] $LibraryDirectory -g $GeneratorName *> $log
            $exitCode = $LASTEXITCODE
        }
        $timer.Stop()
        if ($exitCode -ne 0) {
            throw "Generation failed ($exitCode): $log"
        }

        $stages = [ordered]@{}
        foreach ($line in Get-Content $log) {
            $message = $null
            if ($line.StartsWith('{')) {
                $entry = $line | ConvertFrom-Json
                if ($entry.PSObject.Properties['method'] -and $entry.method -eq 'trace') {
                    $message = $entry.params.message
                }
            }
            elseif ($line -match '^trace [^:]+: (.*)$') {
                $message = $Matches[1]
            }
            if ($message -match '^(.*)\. Total Elapsed time: (.*)$') {
                $stages[$Matches[1]] = [TimeSpan]::Parse($Matches[2]).TotalMilliseconds
            }
        }
        if (-not $stages.Contains('All files have been written to disk')) {
            throw "Generation did not report completion: $log"
        }

        $files = @(Get-ChildItem $generatedDirectory -File -Recurse | Sort-Object FullName | ForEach-Object {
            [ordered]@{
                path = [IO.Path]::GetRelativePath($generatedDirectory, $_.FullName)
                sha256 = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
            }
        })
        if ($files.Count -eq 0) {
            throw "No generated files found in $generatedDirectory"
        }
        $manifest = ConvertTo-Json -InputObject $files -Depth 5 -Compress
        $manifest | Set-Content (Join-Path $ResultDirectory "$variant-$iteration.files.json")
        if ($null -ne $expected -and $manifest -cne $expected) {
            throw "Generated output differs for $variant iteration $iteration. Compare file manifests in $ResultDirectory."
        }
        $expected = $manifest
        $currentInputHashes = @($inputFiles | ForEach-Object {
            (Get-FileHash (Join-Path $LibraryDirectory $_) -Algorithm SHA256).Hash
        })
        if (Compare-Object $inputHashes $currentInputHashes) {
            throw "Saved generator inputs changed during generation."
        }
        if ($iteration -gt 0) {
            $samples[$variant] += [ordered]@{ wallMilliseconds = $timer.Elapsed.TotalMilliseconds; stages = $stages }
        }
    }
}

$results = foreach ($variant in $generators.Keys) {
    $times = @($samples[$variant].wallMilliseconds | Sort-Object)
    $middle = [int][Math]::Floor($Iterations / 2)
    $median = if ($Iterations % 2 -eq 0) { ($times[$middle - 1] + $times[$middle]) / 2 } else { $times[$middle] }
    [ordered]@{
        variant = $variant
        generator = $generators[$variant]
        generatorSha256 = (Get-FileHash $generators[$variant] -Algorithm SHA256).Hash
        medianWallMilliseconds = $median
        samples = $samples[$variant]
    }
}
[ordered]@{
    measurement = if ($endToEnd) { 'typespec-to-csharp' } else { 'csharp-generation' }
    library = $LibraryDirectory
    generatorName = $GeneratorName
    emitterGeneratorDirectory = $EmitterGeneratorDirectory
    inputHashes = $inputHashes
    warmupsPerBuild = 1
    iterationsPerBuild = $Iterations
    generatedFileCount = $files.Count
    results = @($results)
} | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $ResultDirectory 'results.json')
$results | ForEach-Object { [PSCustomObject]$_ } | Select-Object variant, medianWallMilliseconds
