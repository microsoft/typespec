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

$outputPath = $Output ? $Output : "$packageRoot/ci-build"

function Write-PackageInfo {
    param(
        [string] $packageName,
        [string] $directoryPath
    )

    $packageInfoPath = "$outputPath/packages/PackageInfo"

    if (!(Test-Path $packageInfoPath)) {
        New-Item -ItemType Directory -Force -Path $packageInfoPath | Out-Null
    }

    @{
        DirectoryPath = $directoryPath
        IsNewSdk = $true
    } | ConvertTo-Json | Set-Content -Path "$packageInfoPath/$packageName.json"
}

# create the output folders
$outputPath = New-Item -ItemType Directory -Force -Path $outputPath | Select-Object -ExpandProperty FullName
New-Item -ItemType Directory -Force -Path "$outputPath/packages" | Out-Null

$emitterVersion = node -p -e "require('$packageRoot/package.json').version"

if ($BuildNumber) {
    # set package versions
    $versionTag = $Prerelease ? "-alpha" : "-beta"

    $emitterVersion = "$emitterVersion$versionTag.$BuildNumber"
    Write-Host "Setting output variable 'emitterVersion' to $emitterVersion"
    Write-Host "##vso[task.setvariable variable=emitterVersion;isOutput=true]$emitterVersion"
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

    #pack the emitter
    $file = Invoke-LoggedCommand "npm pack -q"
    Copy-Item $file -Destination "$outputPath/packages"

    Write-PackageInfo -packageName "typespec-http-client-csharp" -directoryPath "packages/http-client-csharp/emitter/src"
}
finally
{
    Pop-Location
}

Push-Location "$packageRoot/generator"
try {
    Write-Host "Working in $PWD"

    # pack the generator
    $file = Invoke-LoggedCommand "dotnet pack -c Release -o $outputPath/packages"

    Write-PackageInfo -packageName "Microsoft.Generator.CSharp" -directoryPath "packages/http-client-csharp/generator/Microsoft.Generator.CSharp/src"
    Write-PackageInfo -packageName "Microsoft.Generator.CSharp.ClientModel" -directoryPath "packages/http-client-csharp/generator/Microsoft.Generator.CSharp.ClientModel/src"
    Write-PackageInfo -packageName "Microsoft.Generator.CSharp.Input" -directoryPath "packages/http-client-csharp/generator/Microsoft.Generator.CSharp.Input/src"
    Write-PackageInfo -packageName "Microsoft.Generator.CSharp.Customization" -directoryPath "packages/http-client-csharp/generator/Microsoft.Generator.CSharp.Customization/src"
}
finally
{
    Pop-Location
}

if ($PublishType -eq "internal") {
    $feedUrl = "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js-test-autorest/npm/registry"

    $overrides = @{
        "@typespec/http-client-csharp" = "$feedUrl/@typespec/http-client-csharp/-/http-client-csharp-$emitterVersion.tgz"
    }
} else {
    $overrides = @{}
}

$overrides | ConvertTo-Json | Set-Content "$outputPath/overrides.json"

$packageMatrix = [ordered]@{
    "emitter" = $emitterVersion
}

$packageMatrix | ConvertTo-Json | Set-Content "$outputPath/package-versions.json"
