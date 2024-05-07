#Requires -Version 7.0

param(
    [string] $BuildArtifactsPath,
    [switch] $UseTypeSpecNext
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

Push-Location "$packageRoot"
try {
    if (Test-Path "./node_modules") {
        Remove-Item -Recurse -Force "./node_modules"
    }

    # install dotnet
    if ($IsWindows) {
        # download and run https://dot.net/v1/dotnet-install.ps1
        Invoke-WebRequest 'https://dot.net/v1/dotnet-install.ps1' -OutFile 'dotnet-install.ps1'
        ./dotnet-install.ps1 -Version '8.0.204'
    }
    else {
        Invoke-WebRequest 'https://dot.net/v1/dotnet-install.sh' -OutFile 'dotnet-install.sh'
        bash ./dotnet-install.sh --version 8.0.204
    }

    # install and list npm packages
  
    if ($BuildArtifactsPath) {
        $lockFilesPath = Resolve-Path "$BuildArtifactsPath/lock-files"
        # if we were passed a build_artifacts path, use the package.json and package-lock.json from there
        Write-Host "Using emitter/package.json and emitter/package-lock.json from $lockFilesPath"
        Copy-Item "$lockFilesPath/emitter/package.json" './package.json' -Force
        Copy-Item "$lockFilesPath/emitter/package-lock.json" './package-lock.json' -Force

        Invoke-LoggedCommand "npm ci"
    }
    elseif ($UseTypeSpecNext) {
        # TODO: add use typespec next to template later
    }
    else {
        Invoke-LoggedCommand "npm ci"
    }

    Invoke-LoggedCommand "npm ls -a" -GroupOutput

    Write-Host "artifactStagingDirectory: $env:BUILD_ARTIFACTSTAGINGDIRECTORY"
    Write-Host "BuildArtifactsPath: $BuildArtifactsPath"
    $artifactStagingDirectory = $env:BUILD_ARTIFACTSTAGINGDIRECTORY
    if ($artifactStagingDirectory -and !$BuildArtifactsPath) {
        $lockFilesPath = "$artifactStagingDirectory/lock-files"
        New-Item -ItemType Directory -Path "$lockFilesPath/emitter" | Out-Null
        
        Write-Host "Copying emitter/package.json and emitter/package-lock.json to $lockFilesPath"
        Copy-Item './package.json' "$lockFilesPath/emitter/package.json" -Force
        Copy-Item './package-lock.json' "$lockFilesPath/emitter/package-lock.json" -Force
    }
}
finally {
    Pop-Location
}
