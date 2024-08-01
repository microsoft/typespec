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

    Write-Host "Current PATH: $env:PATH"
    # install Java 21
    
    if ($IsWindows) {
        # download JDK, install 
        Write-Host "Downloading and installing Java 21"
        Invoke-WebRequest 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.4%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.4_7.msi' -OutFile 'java-install.msi'
        ./java-install.msi
        $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot'
        Write-Host "JAVA_HOME: $env:JAVA_HOME"
        
        # download Maven, install
        Write-Host "Downloading and installing Maven"
        Invoke-WebRequest 'https://dlcdn.apache.org/maven/maven-3/3.9.8/binaries/apache-maven-3.9.8-bin.zip' -OutFile 'maven.zip'
        Expand-Archive -Path 'maven.zip' -DestinationPath '.'
        $env:MAVEN_HOME = (Get-ChildItem -Directory -Filter 'apache-maven-*').FullName
        Write-Host "MAVEN_HOME: $env:MAVEN_HOME"

        $env:PATH = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:PATH"
        
    }
    Invoke-LoggedCommand "Get-ChildItem -Path $env:JAVA_HOME -File"
   
    Write-Host "Updated PATH: $env:PATH"
    Invoke-LoggedCommand "java -version"
    Invoke-LoggedCommand "mvn -version"

    # install and list npm packages
 
    if ($BuildArtifactsPath) {
        $lockFilesPath = Resolve-Path "$BuildArtifactsPath/lock-files"
        # if we were passed a build_artifacts path, use the package.json and package-lock.json from there
        Write-Host "Using package.json and package-lock.json from $lockFilesPath"
        Copy-Item "$lockFilesPath/package.json" './package.json' -Force
        Copy-Item "$lockFilesPath/package-lock.json" './package-lock.json' -Force

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
        
        Write-Host "Copying package.json and emitter/package-lock.json to $lockFilesPath"
        Copy-Item './package.json' "$lockFilesPath/emitter/package.json" -Force
        Copy-Item './package-lock.json' "$lockFilesPath/emitter/package-lock.json" -Force
    }
}
finally {
    Pop-Location
}
