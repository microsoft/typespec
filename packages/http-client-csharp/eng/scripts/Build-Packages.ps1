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

function Pack-And-Write-Info {
    param(
        [string] $package,
        [string] $version
    )

    $versionOption = $BuildNumber ? "/p:Version=$version" : ""
    Invoke-LoggedCommand "dotnet pack ./$package/src/$package.csproj $versionOption -c Release -o $outputPath/packages"
    Write-PackageInfo -packageName $package -directoryPath "packages/http-client-csharp/generator/$package/src" -version $version
}

function Get-CsprojVersion {
    param(
        [string] $csprojFilePath
    )

    $csprojContent = Get-Content -Path $csprojFilePath
    $versionElement = $csprojContent | Where-Object { $_ -match '<Version>(.*?)<\/Version>' }

    if ($versionElement) {
        $version = $versionElement -replace '<Version>([^-]*)-.*?<\/Version>', '$1'
    } else {
        Write-Host "Version not found in the .csproj file."
    }
    return $version.Trim()
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
$mgcVersion = Get-CsprojVersion -csprojFilePath "$packageRoot/generator/Microsoft.TypeSpec.Generator/src/Microsoft.TypeSpec.Generator.csproj"
$mgcClientModelVersion = Get-CsprojVersion -csprojFilePath "$packageRoot/generator/Microsoft.TypeSpec.Generator.ClientModel/src/Microsoft.TypeSpec.Generator.ClientModel.csproj"
$mgcInputVersion = Get-CsprojVersion -csprojFilePath "$packageRoot/generator/Microsoft.TypeSpec.Generator.Input/src/Microsoft.TypeSpec.Generator.Input.csproj"

if ($BuildNumber) {
    # set package versions
    $versionTag = $Prerelease ? "-alpha" : "-beta"

    $mgcVersion = "$mgcVersion$versionTag.$BuildNumber"
    Set-VersionVariable -variableName "mgcVersion" -version $mgcVersion

    $mgcClientModelVersion = "$mgcClientModelVersion$versionTag.$BuildNumber"
    Set-VersionVariable -variableName "mgcClientModelVersion" -version $mgcClientModelVersion
 
    $mgcInputVersion = "$mgcInputVersion$versionTag.$BuildNumber"
    Set-VersionVariable -variableName "mgcInputVersion" -version $mgcInputVersion
    
    $emitterVersion = "$emitterVersion$versionTag.$BuildNumber"
    Set-VersionVariable -variableName "emitterVersion" -version $emitterVersion
}

# build and pack the emitter
Push-Location "$packageRoot"
try {
    Write-Host "Working in $PWD"

    Invoke-LoggedCommand "npm run build" -GroupOutput

    Copy-Item "$packageRoot/emitter/temp/*.api.json" -Destination "$outputPath/packages"

    if ($BuildNumber) {
        Write-Host "Updating package.json to version: $emitterVersion`n"

        $packageJson = Get-Content -Raw "package.json" | ConvertFrom-Json -AsHashtable

        $packageJson.version = $emitterVersion

        $packageJson | ConvertTo-Json -Depth 100 | Out-File -Path "package.json" -Encoding utf8 -NoNewline -Force
    }

    #pack the emitter
    $file = Invoke-LoggedCommand "npm pack -q"
    Copy-Item $file -Destination "$outputPath/packages"

    & "$packageRoot/../../eng/emitters/scripts/Generate-APIView-CodeFile.ps1" -ArtifactPath "$outputPath/packages"

    Write-PackageInfo -packageName "typespec-http-client-csharp" -directoryPath "packages/http-client-csharp/emitter/src" -version $emitterVersion
}
finally
{
    Pop-Location
}

Push-Location "$packageRoot/generator"
try {
    Write-Host "Working in $PWD"

    Pack-And-Write-Info -package "Microsoft.TypeSpec.Generator" -version $mgcVersion
    Pack-And-Write-Info -package "Microsoft.TypeSpec.Generator.ClientModel" -version $mgcClientModelVersion
    Pack-And-Write-Info -package "Microsoft.TypeSpec.Generator.Input" -version $mgcInputVersion
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
    "emitter" = $emitterVersion
}

$packageMatrix | ConvertTo-Json | Set-Content "$outputPath/package-versions.json"
