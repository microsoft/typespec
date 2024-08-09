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
    
    # Query Adoptium for the list of installs for the JDK feature version.
    $adoptiumApiUrl = "https://api.adoptium.net"
    $jdkFeatureVersion = "21"
    $os = "linux"

    if ($IsWindows) {
        $os = "windows"
    } elseif ($IsMacOS) {
        $os = "mac"
    } 

    $getInstalls = "$adoptiumApiUrl/v3/assets/latest/$jdkFeatureVersion/hotspot?architecture=x64&image_type=jdk&os=$os&vendor=eclipse"
    $jdkUnzipName = "jdk-$jdkFeatureVersion"

    Write-Host "Downloading latest JDK to" (Get-Location)

    if (!(Test-Path -Path $jdkUnzipName -PathType container)) {
        # Query Adoptium for the list of installs for the JDK feature version.
        Write-Host "Invoking web request to '$getInstalls' to find JDK $jdkFeatureVersion installs available on $os."
        $installsAvailable = Invoke-WebRequest -URI $getInstalls | ConvertFrom-Json
        $jdkLink = $installsAvailable.binary.package.link
        $jdkZipName = $jdkLink.split("/")[-1]

        Write-Host "Downloading install from '$jdkLink' to '$jdkZipName'."
        Invoke-WebRequest -URI $jdkLink -OutFile $jdkZipName

        if ($IsWindows) {
            Expand-Archive -Path $jdkZipName -Destination "jdk-temp"
            Move-Item -Path (Join-Path -Path "jdk-temp" -ChildPath (Get-ChildItem "jdk-temp")[0].Name) -Destination $jdkUnzipName
        } else {
            New-Item -Path "jdk-temp" -ItemType "directory"
            tar -xvf $jdkZipName -C "jdk-temp"
            Move-Item -Path (Join-Path -Path "jdk-temp" -ChildPath (Get-ChildItem "jdk-temp")[0].Name) -Destination $jdkUnzipName
        }
    }

    $javaHome = (Convert-Path $jdkUnzipName)
    Write-Host "Latest JDK: $javaHome"

    Write-Host "Current JAVA_HOME: $Env:JAVA_HOME"
    $env:JAVA_HOME = $javaHome
    Write-Host "Updated JAVA_HOME: $Env:JAVA_HOME"

    $env:PATH = "$javaHome\bin;$env:PATH"
  
    Write-Host "Updated PATH: $env:PATH"
    Invoke-LoggedCommand "java -version"
    Invoke-LoggedCommand "mvn -version"

    # install and list npm packages
    if ($BuildArtifactsPath) {
        $lockFilesPath = Resolve-Path "$BuildArtifactsPath/lock-files"
        # if we were passed a build_artifacts path, use the package.json and package-lock.json from there
        Write-Host "Using package.json and package-lock.json from $lockFilesPath"
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
        
        Write-Host "Copying package.json and emitter/package-lock.json to $lockFilesPath"
        Copy-Item './package.json' "$lockFilesPath/emitter/package.json" -Force
        Copy-Item './package-lock.json' "$lockFilesPath/emitter/package-lock.json" -Force
    }
}
finally {
    Pop-Location
}
