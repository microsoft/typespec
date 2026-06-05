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
The cop release tag to use, or "latest" (default) to track the newest release.

NOTE: cop auto-restores its provider packages (code, csharp) from the GitHub
feed, and the feed always serves the *latest* provider build. Those providers
are version-locked to the cop runtime assembly, so the binary must match the
provider version the feed currently serves -- otherwise the provider fails to
load ("Could not load file or assembly 'cop, Version=...'"). Because the feed
moves with upstream, we default to "latest" so the binary stays in lockstep with
the providers. Pass an explicit tag only to reproduce a historical run.
#>

[CmdletBinding()]
param(
    [string] $Version = "latest"
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

# Cache the downloaded tool per version + platform. When tracking "latest" the
# tag is not fixed, so always re-download to stay in lockstep with the feed's
# provider packages.
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
