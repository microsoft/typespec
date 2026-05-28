#Requires -Version 7.0

param(
    [string] $BuildNumber,
    [string] $Output,
    [switch] $Prerelease,
    [string] $PublishType
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

Write-Host "Building packages for BuildNumber: '$BuildNumber', Output: '$Output', Prerelease: '$Prerelease', PublishType: '$PublishType'"

$outputPath = $Output ? $Output : "$packageRoot/ci-build"

function Write-PackageInfo {
    param(
        [string] $packageName,
        [string] $directoryPath,
        [string] $version
    )

    $packageInfoPath = "$outputPath/PackageInfo"
    if (!(Test-Path $packageInfoPath)) {
        New-Item -ItemType Directory -Force -Path $packageInfoPath | Out-Null
    }

    @{
        Name = $packageName
        Version = $version
        DirectoryPath = $directoryPath
        SdkType = "client"
        IsNewSdk = $true
        ReleaseStatus = "Unreleased"
    } | ConvertTo-Json | Set-Content -Path "$packageInfoPath/$packageName.json"
}

function Set-VersionVariable {
    param(
        [string] $variableName,
        [string] $version
    )

    Write-Host "Setting output variable '$variableName' to $version"
    Write-Host "##vso[task.setvariable variable=$variableName;isOutput=true]$version"
}

# create the output folders
$outputPath = New-Item -ItemType Directory -Force -Path $outputPath | Select-Object -ExpandProperty FullName
New-Item -ItemType Directory -Force -Path "$outputPath/packages" | Out-Null

Write-Host "Getting existing versions"
$emitterVersion = node -p -e "require('$packageRoot/package.json').version"

if ($BuildNumber) {
    # set package versions
    $versionTag = $Prerelease ? "-alpha" : "-beta"

    $emitterVersion = "$emitterVersion$versionTag.$BuildNumber"
    Set-VersionVariable -variableName "emitterVersion" -version $emitterVersion
}

# build and pack the emitter
Push-Location "$packageRoot"
try {
    Write-Host "Working in $PWD"

    Invoke-LoggedCommand "npm run build" -GroupOutput

    if ($BuildNumber) {
        Write-Host "Updating package.json to version: $emitterVersion`n"

        $packageJson = Get-Content -Raw "package.json" | ConvertFrom-Json -AsHashtable
        $packageJson.version = $emitterVersion
        $packageJson | ConvertTo-Json -Depth 100 | Out-File -Path "package.json" -Encoding utf8 -NoNewline -Force
    }

    # pack the emitter
    $file = Invoke-LoggedCommand "npm pack -q"
    Copy-Item $file -Destination "$outputPath/packages"

    Write-PackageInfo -packageName "typespec-http-client-python" -directoryPath "packages/http-client-python/emitter/src" -version $emitterVersion
}
finally {
    Pop-Location
}

if ($PublishType -eq "internal") {
    $feedUrl = "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry"

    $overrides = @{
        "@typespec/http-client-python" = "$feedUrl/@typespec/http-client-python/-/http-client-python-$emitterVersion.tgz"
    }
} else {
    $overrides = @{}
}

$overrides | ConvertTo-Json | Set-Content "$outputPath/overrides.json"

@{ "emitter" = $emitterVersion } | ConvertTo-Json | Set-Content "$outputPath/package-versions.json"
