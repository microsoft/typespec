#Requires -Version 7.0

<#
.SYNOPSIS
Runs the Agent Cop (https://github.com/KrzysztofCwalina/cop) static-analysis
rules under cop-checks/ against the C# generator sources.

.DESCRIPTION
Downloads a cop release for the current platform and runs the checks defined in
cop-checks/main.cop against the generator. Exits with cop's exit code, so any
rule violation fails the build (cop returns 1 when violations are found, 0 when
clean).

The checks are executed from a throwaway working directory that contains only
the rule files. This keeps cop targeted at the generator (via -t) and avoids
scanning node_modules or the rest of the repository.

.PARAMETER Version
The cop release tag to use. Defaults to a pinned tag so CI is reproducible and
upstream cop releases cannot break our build.

NOTE: cop's provider packages (code, csharp) are version-locked to the cop
runtime assembly -- a mismatch makes the provider fail to load ("Could not load
file or assembly 'cop, Version=...'"). We do NOT rely on cop's auto-restore feed
(which always serves the *latest* provider build); instead we vendor the
provider packages from the cop repo at the tag reported by `cop -v` (see below),
so they always match the downloaded binary. Because of that, pinning the binary
to a fixed tag is safe: the providers are pinned to the same tag automatically.

Bumping the pinned version is a deliberate, reviewable change. Before bumping,
verify the rule files in cop-checks/ still run against the new release, since
cop occasionally makes breaking changes to its query API between releases.
Pass "latest" to test against the newest release.
#>

[CmdletBinding()]
param(
    # Pinned cop release. Bump deliberately after verifying the cop-checks/ rules
    # still run against the new release (cop can make breaking API changes
    # between releases). Pass "latest" to test against the newest release.
    [string] $Version = "v2026.6.10.1"
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
$copChecks = "$packageRoot/cop-checks"
$generator = "$packageRoot/generator"

# Map the current platform to a release asset and executable name.
$arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
if ($arch -notin @('x64', 'arm64')) {
    throw "Unsupported architecture for cop: $arch"
}

if ($IsWindows) {
    $os = 'win'
    $exe = 'cop.exe'
}
elseif ($IsLinux) {
    $os = 'linux'
    $exe = 'cop'
}
elseif ($IsMacOS) {
    $os = 'osx'
    $exe = 'cop'
}
else {
    throw "Unsupported operating system for cop."
}

$asset = "cop-$os-$arch.zip"
if ($Version -eq 'latest') {
    # The /releases/latest/download/ redirect always resolves to the newest
    # release asset without an API call (so no unauthenticated rate-limit risk).
    $url = "https://github.com/KrzysztofCwalina/cop/releases/latest/download/$asset"
}
else {
    $url = "https://github.com/KrzysztofCwalina/cop/releases/download/$Version/$asset"
}

# Cache the downloaded tool per version + platform. A pinned tag is immutable, so
# a cached copy can be reused; when "latest" is requested the tag is not fixed, so
# always re-download to stay in lockstep with the feed's provider packages.
$toolDir = Join-Path ([System.IO.Path]::GetTempPath()) "cop-$Version-$os-$arch"
$copPath = Join-Path $toolDir $exe

if ($Version -eq 'latest' -or -not (Test-Path $copPath)) {
    Write-Host "Downloading Agent Cop $Version ($asset)..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $toolDir -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force $toolDir | Out-Null
    $zipPath = Join-Path $toolDir $asset
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $toolDir -Force
    if (-not $IsWindows) {
        chmod +x $copPath
    }
}

# Seed cop's provider package cache from the cop repo instead of relying on its
# auto-restore feed. cop resolves feed packages via the GitHub REST API
# (api.github.com), which is rate-limited to 60 requests/hour for unauthenticated
# callers. On shared CI agents that budget is routinely exhausted, so the restore
# fails with "Package 'code'/'csharp' not found in any configured feed" and the
# csharp provider never loads. Fork PRs have no secrets, so we cannot supply a
# GITHUB_TOKEN to raise the limit.
#
# Instead we vendor the two packages our checks import (code, csharp) directly
# from the cop repo at the tag matching the downloaded binary, using a sparse,
# blob-filtered git clone (git protocol, not the REST API; fetches only those
# two directories). cop is version-locked between its runtime and providers, so
# the package version must match the binary -- we read it from `cop -v`.
$pkgCache = Join-Path $HOME ".cop/packages"
$copVersion = (& $copPath -v) -split '\+' | Select-Object -First 1
$copTag = "v$copVersion"
# Map: cache package name -> path within the cop repo.
$vendoredPackages = @{
    'code'   = 'packages/code'
    'csharp' = 'packages/dotnet/csharp'
}
$cloneDir = Join-Path ([System.IO.Path]::GetTempPath()) "cop-pkgsrc-$([System.Guid]::NewGuid().ToString('N'))"
try {
    Write-Host "Seeding cop provider packages from cop repo @ $copTag..." -ForegroundColor Cyan
    git clone --quiet --no-checkout --depth 1 --branch $copTag --filter=blob:none `
        https://github.com/KrzysztofCwalina/cop.git $cloneDir
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to clone cop repo at tag $copTag for provider packages."
    }
    Push-Location $cloneDir
    try {
        git sparse-checkout set --no-cone @($vendoredPackages.Values) | Out-Null
        git checkout --quiet $copTag
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to check out provider package sources at $copTag."
        }
    }
    finally {
        Pop-Location
    }
    New-Item -ItemType Directory -Force $pkgCache | Out-Null
    foreach ($name in $vendoredPackages.Keys) {
        $src = Join-Path $cloneDir $vendoredPackages[$name]
        $dest = Join-Path $pkgCache $name
        if (-not (Test-Path $src)) {
            throw "Expected package '$name' at '$($vendoredPackages[$name])' in the cop repo, but it was not found."
        }
        Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
        Copy-Item -Recurse -Force $src $dest
    }
}
finally {
    Remove-Item -Recurse -Force $cloneDir -ErrorAction SilentlyContinue
}

# Run cop from a clean directory that contains only the rule files so it
# analyzes the generator and nothing else.
$runDir = Join-Path ([System.IO.Path]::GetTempPath()) "cop-run-$([System.Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Force $runDir | Out-Null
try {
    Copy-Item "$copChecks/*.cop" $runDir
    Push-Location $runDir
    try {
        Write-Host "Running cop checks against $generator" -ForegroundColor Cyan

        # cop auto-restores its provider packages (code, csharp, ...) from the
        # GitHub feed on first run. That download can fail transiently on CI
        # agents (rate limiting / network blips), surfacing as "not found in any
        # configured feed" and a non-zero exit. Retry the run with backoff only
        # for that transient case. A provider *load* failure ("is not loaded" /
        # "Could not load file or assembly") is a version mismatch between the
        # cop binary and the feed's provider build -- not transient -- which the
        # default "latest" $Version avoids; so fail fast instead of retrying.
        $maxAttempts = 5
        $transientPattern = 'not found in any configured feed'
        for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
            $output = & $copPath main.cop -t $generator 2>&1 | Out-String
            Write-Host $output
            $exit = $LASTEXITCODE

            if ($exit -eq 0 -or $output -notmatch $transientPattern) {
                break
            }

            if ($attempt -lt $maxAttempts) {
                $delay = [Math]::Min(30, [Math]::Pow(2, $attempt))
                Write-Host "Package restore failed (transient). Retrying in $delay s..." -ForegroundColor Yellow
                Start-Sleep -Seconds $delay
            }
            else {
                throw "Failed to restore cop provider packages after $maxAttempts attempts."
            }
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-Item -Recurse -Force $runDir -ErrorAction SilentlyContinue
}

if ($exit -ne 0) {
    Write-Error "cop reported violations (exit code $exit). Fix the reported issues before merging."
    exit $exit
}

Write-Host "cop checks passed." -ForegroundColor Green
