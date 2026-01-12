#Requires -Version 7.0

<#
.SYNOPSIS
    Packages local TypeSpec emitter and generator, then updates Azure generator dependencies for Spector validation.

.DESCRIPTION
    This script streamlines the process of testing local TypeSpec changes with Spector test cases by:
    1. Building the local unbranded TypeSpec emitter (@typespec/http-client-csharp)
    2. Packaging it as an npm package with a versioned name
    3. Building and packaging the NuGet generator framework packages
    4. Updating the Azure generator at azure-sdk-for-net to use these local packages
    
    This allows you to quickly validate Spector test cases with local changes without running
    the full RegenPreview workflow.

.PARAMETER AzureSdkRepoPath
    Optional. The path to the azure-sdk-for-net repository.
    Default: C:\Users\jorgerangel\Development\AzureSdk\azure-sdk-for-net

.PARAMETER SkipBuild
    Optional. If specified, skips the build step and only packages existing build artifacts.
    Useful if you've already built the generator and just want to repackage.

.EXAMPLE
    # Update Azure generator with local packages (default path)
    .\Update-AzureGeneratorForSpector.ps1

.EXAMPLE
    # Update Azure generator with custom azure-sdk-for-net path
    .\Update-AzureGeneratorForSpector.ps1 -AzureSdkRepoPath "D:\repos\azure-sdk-for-net"

.EXAMPLE
    # Skip build and just repackage existing artifacts
    .\Update-AzureGeneratorForSpector.ps1 -SkipBuild
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$AzureSdkRepoPath = "C:\Users\jorgerangel\Development\AzureSdk\azure-sdk-for-net",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

# Import utility functions
Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force

# Resolve paths
$packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$azureSdkRepo = Resolve-Path $AzureSdkRepoPath -ErrorAction Stop
$azureGeneratorPath = Join-Path $azureSdkRepo "eng" "packages" "http-client-csharp"

if (-not (Test-Path $azureGeneratorPath)) {
    Write-Error "Azure generator not found at: $azureGeneratorPath"
    exit 1
}

Write-Host "==================== AZURE GENERATOR UPDATE FOR SPECTOR ====================" -ForegroundColor Cyan
Write-Host "TypeSpec Package: $packageRoot" -ForegroundColor Gray
Write-Host "Azure SDK Repo: $azureSdkRepo" -ForegroundColor Gray
Write-Host "Azure Generator: $azureGeneratorPath" -ForegroundColor Gray
Write-Host ""

# Generate version string with timestamp and hash
function Get-LocalPackageVersion {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $hash = (git -C $packageRoot rev-parse --short=7 HEAD 2>$null) ?? "local"
    return "1.0.0-alpha-$timestamp.$hash"
}

# Run npm pack and return the package file path
function Invoke-NpmPack {
    param(
        [string]$WorkingDirectory,
        [string]$DebugFolder
    )
    
    Write-Host "Running: npm pack" -ForegroundColor Gray
    Push-Location $WorkingDirectory
    try {
        $output = & npm pack 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "npm pack failed with exit code $LASTEXITCODE"
        }
        
        # Get the package filename
        $packageLine = ($output | Where-Object { $_ -match '\.tgz$' } | Select-Object -First 1).ToString().Trim()
        if ($packageLine -match 'filename:\s*(.+\.tgz)') {
            $packageFile = $Matches[1].Trim()
        } else {
            $packageFile = $packageLine
        }
        
        $packagePath = Join-Path $WorkingDirectory $packageFile
        if (-not (Test-Path $packagePath)) {
            throw "Package file not created: $packagePath"
        }
        
        # Move package to debug folder
        $debugPackagePath = Join-Path $DebugFolder $packageFile
        Move-Item $packagePath $debugPackagePath -Force
        
        return $debugPackagePath
    }
    finally {
        Pop-Location
    }
}

# Update package.json with new version
function Update-PackageJsonVersion {
    param(
        [string]$PackageJsonPath,
        [string]$NewVersion
    )
    
    Write-Host "Updating package version to $NewVersion in $PackageJsonPath" -ForegroundColor Gray
    $packageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json -AsHashtable
    $packageJson.version = $NewVersion
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content $PackageJsonPath -Encoding utf8 -NoNewline
}

try {
    # Create debug folder for packaged artifacts
    $timestamp = Get-Date -Format "yyyyMMdd"
    $debugFolder = Join-Path $packageRoot "debug" $timestamp
    if (-not (Test-Path $debugFolder)) {
        New-Item -ItemType Directory -Path $debugFolder -Force | Out-Null
    }
    
    Write-Host "Debug folder: $debugFolder" -ForegroundColor Gray
    Write-Host ""
    
    # Step 1: Build the unbranded generator (unless SkipBuild is specified)
    if (-not $SkipBuild) {
        Write-Host "[1/3] Building unbranded generator..." -ForegroundColor Cyan
        
        Push-Location $packageRoot
        try {
            Write-Host "Installing dependencies..." -ForegroundColor Gray
            Invoke "npm ci" $packageRoot
            if ($LASTEXITCODE -ne 0) {
                throw "npm ci failed"
            }
            
            Write-Host "Cleaning build artifacts..." -ForegroundColor Gray
            Invoke "npm run clean" $packageRoot
            if ($LASTEXITCODE -ne 0) {
                throw "npm run clean failed"
            }
            
            Write-Host "Building generator..." -ForegroundColor Gray
            Invoke "npm run build" $packageRoot
            if ($LASTEXITCODE -ne 0) {
                throw "npm run build failed"
            }
            
            Write-Host "  Build completed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    } else {
        Write-Host "[1/3] Skipping build (using existing artifacts)..." -ForegroundColor Yellow
    }
    
    # Step 2: Package the generators
    Write-Host "`n[2/3] Packaging generators..." -ForegroundColor Cyan
    
    $localVersion = Get-LocalPackageVersion
    Write-Host "Local package version: $localVersion" -ForegroundColor Yellow
    
    # Package npm emitter
    $unbrandedPackageJson = Join-Path $packageRoot "package.json"
    $originalPackageJson = Get-Content $unbrandedPackageJson -Raw
    
    try {
        Update-PackageJsonVersion -PackageJsonPath $unbrandedPackageJson -NewVersion $localVersion
        $unbrandedPackagePath = Invoke-NpmPack -WorkingDirectory $packageRoot -DebugFolder $debugFolder
        Write-Host "Created npm package: $unbrandedPackagePath" -ForegroundColor Green
    }
    finally {
        # Restore original package.json
        Set-Content $unbrandedPackageJson $originalPackageJson -Encoding utf8 -NoNewline
    }
    
    # Build and package NuGet packages
    Write-Host "Building NuGet generator packages..." -ForegroundColor Gray
    
    $generatorRoot = Join-Path $packageRoot "generator"
    $nugetProjects = @(
        "Microsoft.TypeSpec.Generator\src\Microsoft.TypeSpec.Generator.csproj",
        "Microsoft.TypeSpec.Generator.Input\src\Microsoft.TypeSpec.Generator.Input.csproj",
        "Microsoft.TypeSpec.Generator.ClientModel\src\Microsoft.TypeSpec.Generator.ClientModel.csproj"
    )
    
    foreach ($project in $nugetProjects) {
        $projectPath = Join-Path $generatorRoot $project
        if (-not (Test-Path $projectPath)) {
            throw "Project not found: $projectPath"
        }
        
        Write-Host "Packing: $(Split-Path $projectPath -Leaf)" -ForegroundColor Gray
        $packCmd = "dotnet pack `"$projectPath`" /p:Version=$localVersion /p:PackageVersion=$localVersion /p:PackageOutputPath=`"$debugFolder`" --configuration Debug --no-build --nologo -v:quiet"
        Invoke $packCmd $generatorRoot
    }
    
    Write-Host "  NuGet packages created" -ForegroundColor Green
    
    # Step 3: Update Azure generator dependencies
    Write-Host "`n[3/3] Updating Azure generator dependencies..." -ForegroundColor Cyan
    
    $azurePackageJsonPath = Join-Path $azureGeneratorPath "package.json"
    if (-not (Test-Path $azurePackageJsonPath)) {
        throw "Azure generator package.json not found: $azurePackageJsonPath"
    }
    
    # Update package.json dependencies
    Write-Host "Updating @typespec/http-client-csharp dependency..." -ForegroundColor Gray
        $packageJson = Get-Content $azurePackageJsonPath -Raw | ConvertFrom-Json
        
        if ($packageJson.dependencies -and $packageJson.dependencies.'@typespec/http-client-csharp') {
            $packageJson.dependencies.'@typespec/http-client-csharp' = "file:$unbrandedPackagePath"
            $packageJson | ConvertTo-Json -Depth 100 | Set-Content $azurePackageJsonPath -Encoding UTF8
            Write-Host "  Updated dependency to: file:$unbrandedPackagePath" -ForegroundColor Green
        } else {
            throw "@typespec/http-client-csharp not found in Azure generator dependencies"
        }
        
        # Run npm install to update package-lock.json
        Write-Host "Running npm install..." -ForegroundColor Gray
        Push-Location $azureGeneratorPath
        try {
            $installOutput = & npm install --package-lock-only 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host $installOutput -ForegroundColor Red
                throw "npm install --package-lock-only failed"
            }
            
            $ciOutput = & npm ci 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host $ciOutput -ForegroundColor Red
                throw "npm ci failed"
            }
            
            Write-Host "  Dependencies installed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
        
        # Update Packages.Data.props with local NuGet version for the generator packages
        Write-Host "Updating Packages.Data.props with local package versions..." -ForegroundColor Gray
        $packagesDataPropsPath = Join-Path $azureSdkRepo "eng" "Packages.Data.props"
        
        if (Test-Path $packagesDataPropsPath) {
            $propsContent = Get-Content $packagesDataPropsPath -Raw
            
            # Update UnbrandedGeneratorVersion
            $unbrandedPattern = '(<UnbrandedGeneratorVersion>)([^<]+)(</UnbrandedGeneratorVersion>)'
            if ($propsContent -match $unbrandedPattern) {
                $propsContent = $propsContent -replace $unbrandedPattern, "<UnbrandedGeneratorVersion>$localVersion</UnbrandedGeneratorVersion>"
                Write-Host "  Updated UnbrandedGeneratorVersion to $localVersion" -ForegroundColor Green
            }
            
            Set-Content $packagesDataPropsPath -Value $propsContent -Encoding utf8 -NoNewline
        } else {
            throw "Packages.Data.props not found at: $packagesDataPropsPath"
        }
        
        # Add local NuGet source to the azure-sdk-for-net NuGet.Config
        Write-Host "Adding local NuGet source..." -ForegroundColor Gray
        $nugetConfigPath = Join-Path $azureSdkRepo "NuGet.Config"
        if (Test-Path $nugetConfigPath) {
            [xml]$nugetConfig = Get-Content $nugetConfigPath
            
            # Ensure packageSources element exists
            $packageSources = $nugetConfig.configuration.packageSources
            if ($packageSources) {
                # Create local source element
                $localSource = $nugetConfig.CreateElement("add")
                $localSource.SetAttribute("key", "local-codegen-debug-packages")
                $localSource.SetAttribute("value", $debugFolder)
                
                # Find the <clear /> element and insert after it
                $clearElement = $packageSources.ChildNodes | Where-Object { $_.Name -eq "clear" } | Select-Object -First 1
                
                if ($clearElement -and $clearElement.NextSibling) {
                    $packageSources.InsertBefore($localSource, $clearElement.NextSibling) | Out-Null
                } elseif ($clearElement) {
                    $packageSources.AppendChild($localSource) | Out-Null
                } else {
                    if ($packageSources.FirstChild) {
                        $packageSources.InsertBefore($localSource, $packageSources.FirstChild) | Out-Null
                    } else {
                        $packageSources.AppendChild($localSource) | Out-Null
                    }
                }
                
                $nugetConfig.Save($nugetConfigPath)
                Write-Host "  Added local NuGet source: $debugFolder" -ForegroundColor Green
            }
        }
        
        Write-Host "`n==================== UPDATE COMPLETE ====================" -ForegroundColor Green
        Write-Host "Azure generator updated with local packages" -ForegroundColor White
        Write-Host "Local version: $localVersion" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Packages location: $debugFolder" -ForegroundColor Gray
        Write-Host ""
        Write-Host "You can now run Spector tests with your local changes!" -ForegroundColor Green
        Write-Host ""
        Write-Host "When done testing, restore original state from azure-sdk-for-net repo:" -ForegroundColor Cyan
        Write-Host "  git restore eng/packages/http-client-csharp eng/Packages.Data.props NuGet.Config" -ForegroundColor Gray
        Write-Host "=============================================================" -ForegroundColor Cyan
}
catch {
    Write-Host "`nScript encountered an error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    exit 1
}

Write-Host "`nScript completed successfully." -ForegroundColor Cyan
