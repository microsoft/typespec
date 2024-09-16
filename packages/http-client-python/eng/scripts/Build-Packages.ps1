#Requires -Version 7.0

param(
    [string] $BuildNumber,
    [string] $Output,
    [switch] $Prerelease,
    [string] $PublishType
)

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

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

Write-Host "Building packages for BuildNumber: '$BuildNumber', Output: '$Output', Prerelease: '$Prerelease', PublishType: '$PublishType'"

$outputPath = $Output ? $Output : "$packageRoot/ci-build"

# create the output folders
$outputPath = New-Item -ItemType Directory -Force -Path $outputPath | Select-Object -ExpandProperty FullName
New-Item -ItemType Directory -Force -Path "$outputPath/packages" | Out-Null

Write-Host "Getting existing version"
$emitterVersion = node -p -e "require('$packageRoot/package.json').version"

# build the generator jar
Push-Location "$packageRoot/generator"

# build and pack the emitter with the generator jar
Push-Location "$packageRoot"
try {
    Write-Host "Working in $PWD"

    Invoke-LoggedCommand "npm run build" -GroupOutput

    Write-PackageInfo -packageName "typespec-http-client-python" -directoryPath "packages/http-client-python/emitter/src" -version $emitterVersion
}
finally {
    Pop-Location
}

if ($PublishType -eq "internal") {
    $feedUrl = "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js-test-autorest/npm/registry"

    $overrides = @{
        "@typespec/http-client-python" = "$feedUrl/@typespec/http-client-python/-/http-client-python-$emitterVersion.tgz"
    }
} else {
    $overrides = @{}
}

$overrides | ConvertTo-Json | Set-Content "$outputPath/overrides.json"

$packageMatrix = [ordered]@{
    "emitter" = $emitterVersion
}

$packageMatrix | ConvertTo-Json | Set-Content "$outputPath/package-versions.json"
