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

    $packageInfoPath = "$outputPath/PackageInfo"

    if (!(Test-Path $packageInfoPath)) {
        New-Item -ItemType Directory -Force -Path $packageInfoPath | Out-Null
    }

    @{
        DirectoryPath = $directoryPath
        IsNewSdk = $true
    } | ConvertTo-Json | Set-Content -Path "$packageInfoPath/$packageName.json"
}

function Pack-And-Write-Info {
    param(
        [string] $package,
        [string] $versionOption
    )

    Invoke-LoggedCommand "dotnet pack $package/src/$package.csproj $versionOption -c Release -o $outputPath/packages"
    Write-PackageInfo -packageName $package -directoryPath "packages/http-client-csharp/generator/$package/src"
}

function Get-Version-From-Csproj {
    param(
        [string] $csprojFilePath
    )

    $csprojContent = Get-Content -Path $csprojFilePath
    $versionElement = $csprojContent | Where-Object { $_ -match '<Version>(.*?)<\/Version>' }

    if ($versionElement) {
        $version = $versionElement -replace '<Version>(.*?)<\/Version>', '$1'
        Write-Output "Version: $version"
    } else {
        Write-Output "Version not found in the .csproj file."
    }
}

# create the output folders
$outputPath = New-Item -ItemType Directory -Force -Path $outputPath | Select-Object -ExpandProperty FullName
New-Item -ItemType Directory -Force -Path "$outputPath/packages" | Out-Null

# Read the contents of the .csproj file
$csprojContent = Get-Content -Path $csprojFilePath

# Search for the <Version> element in the .csproj file
$versionElement = $csprojContent | Where-Object { $_ -match '<Version>(.*?)<\/Version>' }

# Extract the version number from the <Version> element
if ($versionElement) {
    $version = $versionElement -replace '<Version>(.*?)<\/Version>', '$1'
    Write-Output "Version: $version"
} else {
    Write-Output "Version not found in the .csproj file."
}

$emitterVersion = node -p -e "require('$packageRoot/package.json').version"
$mgcVersion = Get-Version-From-Csproj "$packageRoot/generator/Microsoft.Generator.CSharp/Microsoft.Generator.CSharp.csproj"
$mgcClientModelVersion = Get-Version-From-Csproj "$packageRoot/generator/Microsoft.Generator.CSharp.ClientModel/Microsoft.Generator.CSharp.ClientModel.csproj"
$mgcInputVersion = Get-Version-From-Csproj "$packageRoot/generator/Microsoft.Generator.CSharp.Input/Microsoft.Generator.CSharp.Input.csproj"
$mgcCustomizationVersion = Get-Version-From-Csproj "$packageRoot/generator/Microsoft.Generator.CSharp.Customization/Microsoft.Generator.CSharp.Customization.csproj"

if ($BuildNumber) {
    # set package versions
    $versionTag = $Prerelease ? "-alpha" : "-beta"

    $mgcVersion = "$mgcVersion$versionTag.$BuildNumber"
    Write-Host "Setting output variable 'mgcVersion' to $mgcVersion"
    Write-Host "##vso[task.setvariable variable=mgcVersion;isoutput=true]$mgcVersion"

    $mgcClientModelVersion = "$mgcClientModelVersion$versionTag.$BuildNumber"
    Write-Host "Setting output variable 'mgcClientModelVersion' to $mgcClientModelVersion"
    Write-Host "##vso[task.setvariable variable=mgcClientModelVersion;isoutput=true]$mgcClientModelVersion"

    $mgcInputVersion = "$mgcInputVersion$versionTag.$BuildNumber"
    Write-Host "Setting output variable 'mgcInputVersion' to $mgcInputVersion"
    Write-Host "##vso[task.setvariable variable=mgcInputVersion;isoutput=true]$mgcInputVersion"

    $mgcCustomizationVersion = "$mgcCustomizationVersion$versionTag.$BuildNumber"
    Write-Host "Setting output variable 'mgcCustomizationVersion' to $mgcCustomizationVersion"
    Write-Host "##vso[task.setvariable variable=mgcCustomizationVersion;isoutput=true]$mgcCustomizationVersion"

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

    Pack-And-Write-Info "Microsoft.Generator.CSharp" $BuildNumber ? "/p:Version=$mgcVersion" : ""
    Pack-And-Write-Info "Microsoft.Generator.CSharp.ClientModel" $BuildNumber ? "/p:Version=$mgcClientModelVersion" : ""
    Pack-And-Write-Info "Microsoft.Generator.CSharp.Input" $BuildNumber ? "/p:Version=$mgcInputVersion" : ""
    Pack-And-Write-Info "Microsoft.Generator.CSharp.Customization" $BuildNumber ? "/p:Version=$mgcCustomizationVersion" : ""
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
    "mgc" = $mgcVersion
    "mgc-client-model" = $mgcClientModelVersion
    "mgc-input" = $mgcInputVersion
    "mgc-customization" = $mgcCustomizationVersion
    "emitter" = $emitterVersion
}

$packageMatrix | ConvertTo-Json | Set-Content "$outputPath/package-versions.json"
