#Requires -Version 7.0

<#
.SYNOPSIS
    Script to add launch settings profile for easy debugging of TypeSpec generation

.DESCRIPTION
    This script creates a debug profile for Visual Studio that uses locally built emitters.
    It follows the same workflow as RegenPreview.ps1 to ensure local changes are reflected:
    
    1. Builds local unbranded emitter (@typespec/http-client-csharp)
    2. Builds local Azure/Mgmt emitters as needed
    3. Updates azure-sdk-for-net artifacts to reference local builds
    4. Runs code generation with local builds to create tspCodeModel.json
    5. Adds a new debug profile to launchSettings.json
    6. Restores all modified artifacts using git restore
    
    The script automatically detects which emitter/generator to use by:
    - Checking tsp-location.yaml for the configured emitter package
    - Detecting OpenAI plugin by checking if the path contains "openai-dotnet"

.PARAMETER SdkDirectory
    Path to the target SDK service directory (for Azure SDK) or OpenAI repository root (for OpenAI plugin)

.EXAMPLE
    .\Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs"

.EXAMPLE
    .\Add-Debug-Profile.ps1 -SdkDirectory ".\local-sdk-dir"

.EXAMPLE
    .\Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\openai-dotnet"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SdkDirectory
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force
Import-Module "$PSScriptRoot\RegenPreview.psm1" -DisableNameChecking -Force

# Check if the SDK directory is an OpenAI plugin repository
function Test-IsOpenAIPlugin {
    param([string]$SdkPath)
    
    if ($SdkPath -match 'openai-dotnet') {
        return $true
    }
    
    return $false
}

# Generate version string with timestamp and hash (reused from RegenPreview)
function Get-LocalPackageVersion {
    $packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
    $timestamp = Get-Date -Format "yyyyMMdd"
    $hash = (git -C $packageRoot rev-parse --short HEAD 2>$null) ?? "local"
    return "1.0.0-alpha.$timestamp.$hash"
}

# Read and parse tsp-location.yaml to get emitter configuration
function Get-EmitterFromTspLocation {
    param([string]$SdkPath)
    
    $tspLocationPath = Join-Path $SdkPath "tsp-location.yaml"
    
    if (-not (Test-Path $tspLocationPath)) {
        Write-Host "tsp-location.yaml not found at $tspLocationPath" -ForegroundColor Yellow
        return $null
    }
    
    try {
        $content = Get-Content $tspLocationPath -Raw
        
        if ($content -match 'emitterPackageJsonPath:\s*["'']?[^"''\n]*azure-typespec-http-client-csharp-mgmt[^"''\n]*["'']?') {
            return "@azure-typespec/http-client-csharp-mgmt"
        }
        elseif ($content -match 'emitterPackageJsonPath:\s*["'']?[^"''\n]*azure-typespec-http-client-csharp[^"''\n]*["'']?') {
            return "@azure-typespec/http-client-csharp"
        }
        elseif ($content -match 'emitterPackageJsonPath:\s*["'']?[^"''\n]*http-client-csharp[^"''\n]*["'']?') {
            return "@typespec/http-client-csharp"
        }
        else {
            Write-Host "Could not determine emitter from tsp-location.yaml" -ForegroundColor Yellow
            return $null
        }
    }
    catch {
        Write-Warning "Failed to parse tsp-location.yaml: $($_.Exception.Message)"
        return $null
    }
}

# Map emitter package name to generator name and package name
function Get-GeneratorConfig {
    param([string]$EmitterPackage)
    
    if (-not $EmitterPackage) {
        throw "EmitterPackage must be specified. Could not find emitter configuration in tsp-location.yaml"
    }
    
    switch ($EmitterPackage) {
        "@azure-typespec/http-client-csharp-mgmt" {
            return @{
                PackageName = "http-client-csharp-mgmt"
                GeneratorName = "ManagementClientGenerator"
                ScopeName = "@azure-typespec"
            }
        }
        "@typespec/http-client-csharp" {
            return @{
                PackageName = "http-client-csharp"
                GeneratorName = "ScmCodeModelGenerator"
                ScopeName = "@typespec"
            }
        }
        "@azure-typespec/http-client-csharp" {
            return @{
                PackageName = "http-client-csharp"
                GeneratorName = "AzureClientGenerator"
                ScopeName = "@azure-typespec"
            }
        }
    }
}

# Build local unbranded emitter and package it
function Build-LocalUnbrandedEmitter {
    param(
        [string]$PackageRoot,
        [string]$DebugFolder,
        [string]$LocalVersion
    )
    
    Write-Host "Building local unbranded emitter..." -ForegroundColor Cyan
    
    Push-Location $PackageRoot
    try {
        Write-Host "Installing dependencies..." -ForegroundColor Gray
        Invoke "npm ci" $PackageRoot | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies"
        }
        
        Write-Host "Cleaning build artifacts..." -ForegroundColor Gray
        Invoke "npm run clean" $PackageRoot | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to clean"
        }
        
        Write-Host "Building emitter..." -ForegroundColor Gray
        Invoke "npm run build" $PackageRoot | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build"
        }
        
        Write-Host "  Build completed" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    
    # Package the emitter
    Write-Host "Packaging unbranded emitter..." -ForegroundColor Gray
    $packageJsonPath = Join-Path $PackageRoot "package.json"
    $originalPackageJson = Get-Content $packageJsonPath -Raw
    
    try {
        $packageJson = $originalPackageJson | ConvertFrom-Json -AsHashtable
        $packageJson.version = $LocalVersion
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding utf8 -NoNewline
        
        Push-Location $PackageRoot
        try {
            $output = & npm pack 2>&1
            if ($LASTEXITCODE -ne 0) {
                throw "npm pack failed"
            }
            
            $packageLine = ($output | Where-Object { $_ -match '\.tgz$' } | Select-Object -First 1)
            if ($packageLine) {
                $packageLine = $packageLine.ToString().Trim()
                if ($packageLine -match 'filename:\s*(.+\.tgz)') {
                    $packageFile = $Matches[1].Trim()
                } else {
                    $packageFile = $packageLine
                }
            } else {
                # If we can't find .tgz in output, try to construct the filename
                $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
                $packageFile = "$($packageJson.name.Replace('@', '').Replace('/', '-'))-$LocalVersion.tgz"
                Write-Host "  Could not parse package filename from npm output, using: $packageFile" -ForegroundColor Yellow
            }
            
            $packagePath = Join-Path $PackageRoot $packageFile
            if (-not (Test-Path $packagePath)) {
                throw "Package file not found at: $packagePath"
            }
            
            $debugPackagePath = Join-Path $DebugFolder $packageFile
            Move-Item $packagePath $debugPackagePath -Force
            
            Write-Host "  Created: $packageFile" -ForegroundColor Green
            return $debugPackagePath
        }
        finally {
            Pop-Location
        }
    }
    finally {
        Set-Content $packageJsonPath $originalPackageJson -Encoding utf8 -NoNewline
    }
}

# Build local NuGet generator packages
function Build-LocalNuGetPackages {
    param(
        [string]$PackageRoot,
        [string]$DebugFolder,
        [string]$LocalVersion
    )
    
    Write-Host "Building NuGet generator packages..." -ForegroundColor Gray
    
    # Clean old packages from debug folder to avoid version conflicts
    Write-Host "  Cleaning old NuGet packages from debug folder..." -ForegroundColor Gray
    $oldPackages = Get-ChildItem -Path $DebugFolder -Filter "Microsoft.TypeSpec.Generator*.nupkg" -ErrorAction SilentlyContinue
    foreach ($pkg in $oldPackages) {
        Remove-Item $pkg.FullName -Force
        Write-Host "    Removed: $($pkg.Name)" -ForegroundColor Gray
    }
    
    $generatorRoot = Join-Path $PackageRoot "generator"
    $nugetProjects = @(
        "Microsoft.TypeSpec.Generator\src\Microsoft.TypeSpec.Generator.csproj",
        "Microsoft.TypeSpec.Generator.Input\src\Microsoft.TypeSpec.Generator.Input.csproj",
        "Microsoft.TypeSpec.Generator.ClientModel\src\Microsoft.TypeSpec.Generator.ClientModel.csproj"
    )
    
    foreach ($project in $nugetProjects) {
        $projectPath = Join-Path $generatorRoot $project
        if (-not (Test-Path $projectPath)) {
            throw "NuGet project not found: $projectPath"
        }
        
        Write-Host "  Packing: $(Split-Path $projectPath -Leaf)" -ForegroundColor Gray
        $packCmd = "dotnet pack `"$projectPath`" /p:Version=$LocalVersion /p:PackageVersion=$LocalVersion /p:PackageOutputPath=`"$DebugFolder`" --configuration Debug --no-build --nologo -v:quiet"
        Invoke $packCmd $generatorRoot | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to pack $(Split-Path $projectPath -Leaf)"
        }
    }
    
    # Verify packages were created
    Write-Host "  Verifying NuGet packages..." -ForegroundColor Gray
    $expectedPackages = @(
        "Microsoft.TypeSpec.Generator.$LocalVersion.nupkg",
        "Microsoft.TypeSpec.Generator.Input.$LocalVersion.nupkg",
        "Microsoft.TypeSpec.Generator.ClientModel.$LocalVersion.nupkg"
    )
    
    foreach ($expectedPkg in $expectedPackages) {
        $pkgPath = Join-Path $DebugFolder $expectedPkg
        if (-not (Test-Path $pkgPath)) {
            throw "Expected NuGet package not found: $expectedPkg"
        }
        Write-Host "    Verified: $expectedPkg" -ForegroundColor Gray
    }
    
    Write-Host "  NuGet packages created and verified" -ForegroundColor Green
}

# Run code generation to create tspCodeModel
function Invoke-CodeGeneration {
    param(
        [string]$SdkPath,
        [bool]$IsOpenAI = $false
    )
    
    Write-Host "Running code generation to create tspCodeModel..." -ForegroundColor Cyan
    
    if ($IsOpenAI) {
        $codeGenScript = Join-Path $SdkPath "scripts" "Invoke-CodeGen.ps1"
        if (-not (Test-Path $codeGenScript)) {
            throw "Invoke-CodeGen.ps1 not found: $codeGenScript"
        }
        
        Push-Location $SdkPath
        try {
            $output = & $codeGenScript -Clean 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Code generation completed with warnings"
            }
            Write-Host "  Code generation completed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }
    else {
        # Determine build path (check for src subdirectory)
        $srcPath = Join-Path $SdkPath "src"
        $buildPath = if ((Test-Path $srcPath) -and (Get-ChildItem -Path $srcPath -Filter "*.csproj" -ErrorAction SilentlyContinue)) {
            $srcPath
        } else {
            $SdkPath
        }
        
        Push-Location $buildPath
        try {
            $output = & dotnet build /t:GenerateCode 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Code generation completed with warnings"
            }
            Write-Host "  Code generation completed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }
}

# Get the path to launchSettings.json
function Get-LaunchSettingsPath {
    $packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
    return Join-Path $packageRoot 'generator' 'Microsoft.TypeSpec.Generator' 'src' 'Properties' 'launchSettings.json'
}

# Read and parse launchSettings.json
function Get-LaunchSettings {
    $launchSettingsPath = Get-LaunchSettingsPath
    $content = Get-Content $launchSettingsPath -Raw
    return $content | ConvertFrom-Json
}

# Set launchSettings.json
function Set-LaunchSettings {
    param($launchSettings)
    $launchSettingsPath = Get-LaunchSettingsPath
    $launchSettings | ConvertTo-Json -Depth 100 | Set-Content $launchSettingsPath -Encoding utf8
}

# Generate a profile name from the SDK directory
function Get-ProfileName {
    param([string]$SdkPath)
    
    $dirName = Split-Path $SdkPath -Leaf
    return $dirName -replace '[^a-zA-Z0-9\-_.]', '-'
}

# Add or update a debug profile in launchSettings.json
function Add-DebugProfile {
    param(
        [string]$SdkPath,
        [string]$EmitterPackage,
        [bool]$IsOpenAI = $false
    )
    
    $launchSettings = Get-LaunchSettings
    $profileName = Get-ProfileName $SdkPath
    $resolvedSdkPath = Resolve-Path $SdkPath
    
    if ($IsOpenAI) {
        $generatorName = "OpenAILibraryGenerator"
        $dllPath = "`"$resolvedSdkPath/codegen/dist/generator/Microsoft.TypeSpec.Generator.dll`""
    }
    else {
        $generatorConfig = Get-GeneratorConfig $EmitterPackage
        $packageName = $generatorConfig.PackageName
        $generatorName = $generatorConfig.GeneratorName
        $scopeName = $generatorConfig.ScopeName
        
        $dllPath = "`"$resolvedSdkPath/TempTypeSpecFiles/node_modules/$scopeName/$packageName/dist/generator/Microsoft.TypeSpec.Generator.dll`""
    }
    
    $newProfile = @{
        commandLineArgs = "$dllPath `"$resolvedSdkPath`" -g $generatorName"
        commandName = "Executable"
        executablePath = "dotnet"
    }
    
    $launchSettings.profiles | Add-Member -Name $profileName -Value $newProfile -MemberType NoteProperty -Force
    
    Set-LaunchSettings $launchSettings
    
    Write-Host "Added debug profile '$profileName' to launchSettings.json" -ForegroundColor Green
    Write-Host "Profile configuration:" -ForegroundColor Cyan
    Write-Host "  - Executable: dotnet" -ForegroundColor White
    Write-Host "  - Arguments: $dllPath `"$resolvedSdkPath`" -g $generatorName" -ForegroundColor White
    Write-Host "  - Generator: $generatorName" -ForegroundColor White
    if (-not $IsOpenAI) {
        Write-Host "  - Package: $packageName" -ForegroundColor White
        Write-Host "  - Emitter: $EmitterPackage (from tsp-location.yaml)" -ForegroundColor White
    }
    else {
        Write-Host "  - Mode: OpenAI Plugin" -ForegroundColor White
    }
    
    return $profileName
}

# Main execution
try {
    Write-Host "==================== ADD DEBUG PROFILE ====================" -ForegroundColor Cyan
    Write-Host ""
    
    $sdkPath = Resolve-Path $SdkDirectory -ErrorAction Stop
    $isOpenAI = Test-IsOpenAIPlugin $sdkPath
    
    if ($isOpenAI) {
        Write-Host "Mode: OpenAI Plugin" -ForegroundColor Yellow
    }
    else {
        Write-Host "Mode: Azure SDK" -ForegroundColor Yellow
        
        # Parse tsp-location.yaml early to fail fast if unable to parse
        Write-Host "Validating tsp-location.yaml..." -ForegroundColor Gray
        $emitterPackage = Get-EmitterFromTspLocation $sdkPath
        if (-not $emitterPackage) {
            throw "Could not determine emitter type from tsp-location.yaml in $sdkPath"
        }
        Write-Host "  Detected emitter: $emitterPackage" -ForegroundColor Green
    }
    Write-Host ""
    
    $packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
    $timestamp = Get-Date -Format "yyyyMMdd"
    $debugFolder = Join-Path $packageRoot "debug" $timestamp
    if (-not (Test-Path $debugFolder)) {
        New-Item -ItemType Directory -Path $debugFolder -Force | Out-Null
    }
    
    Write-Host "Debug folder: $debugFolder" -ForegroundColor Gray
    Write-Host ""
    
    $localVersion = Get-LocalPackageVersion
    Write-Host "Local package version: $localVersion" -ForegroundColor Yellow
    Write-Host ""
    
    # Step 1: Build local unbranded emitter
    Write-Host "[1/5] Building local unbranded emitter..." -ForegroundColor Cyan
    $unbrandedPackagePath = Build-LocalUnbrandedEmitter -PackageRoot $packageRoot -DebugFolder $debugFolder -LocalVersion $localVersion
    
    if ([string]::IsNullOrWhiteSpace($unbrandedPackagePath)) {
        throw "Build-LocalUnbrandedEmitter did not return a valid package path"
    }
    
    if (-not (Test-Path $unbrandedPackagePath)) {
        throw "Unbranded package file not found at: $unbrandedPackagePath"
    }
    
    Write-Host "  Package path: $unbrandedPackagePath" -ForegroundColor Gray
    
    # Step 2: Build NuGet packages
    Write-Host "`n[2/5] Building NuGet generator packages..." -ForegroundColor Cyan
    Build-LocalNuGetPackages -PackageRoot $packageRoot -DebugFolder $debugFolder -LocalVersion $localVersion
    
    if ($isOpenAI) {
        # OpenAI workflow
        Write-Host "`n[3/5] Updating OpenAI generator..." -ForegroundColor Cyan
        
        try {
            Update-OpenAIGenerator `
                -OpenAIRepoPath $sdkPath `
                -UnbrandedPackagePath $unbrandedPackagePath `
                -LocalVersion $localVersion `
                -DebugFolder $debugFolder
            
            Write-Host "  OpenAI generator updated" -ForegroundColor Green
        }
        catch {
            Write-Error "Failed to update OpenAI generator: $($_.Exception.Message)"
            throw
        }
        
        # Step 4: Run code generation
        Write-Host "`n[4/5] Running code generation..." -ForegroundColor Cyan
        Invoke-CodeGeneration -SdkPath $sdkPath -IsOpenAI $true
        
        # Step 5: Add debug profile
        Write-Host "`n[5/5] Adding debug profile..." -ForegroundColor Cyan
        $profileName = Add-DebugProfile -SdkPath $sdkPath -EmitterPackage $null -IsOpenAI $true
        
        # Restore artifacts
        Write-Host "`nRestoring modified artifacts..." -ForegroundColor Cyan
        Push-Location $sdkPath
        try {
            $filesToRestore = @(
                "codegen/package.json"
                "codegen/package-lock.json"
                "nuget.config"
                "codegen/generator/src/OpenAI.Library.Plugin.csproj"
            )
            $restoreCmd = "git restore $($filesToRestore -join ' ')"
            Invoke $restoreCmd $sdkPath
            Write-Host "  All artifacts restored" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to restore some artifacts: $_"
        }
        finally {
            Pop-Location
        }
    }
    else {
        # Azure SDK workflow
        # Note: $emitterPackage was already parsed and validated earlier
        
        Write-Host "Detected emitter: $emitterPackage" -ForegroundColor Yellow
        Write-Host ""
        
        $needsAzure = $emitterPackage -in @("@azure-typespec/http-client-csharp", "@azure-typespec/http-client-csharp-mgmt")
        $needsMgmt = $emitterPackage -eq "@azure-typespec/http-client-csharp-mgmt"
        
        # Find azure-sdk-for-net root
        $sdkRepoPath = $sdkPath
        while ($sdkRepoPath -and -not (Test-Path (Join-Path $sdkRepoPath "eng" "Packages.Data.props"))) {
            $parent = Split-Path $sdkRepoPath -Parent
            if ($parent -eq $sdkRepoPath) {
                throw "Could not find azure-sdk-for-net repository root from $sdkPath"
            }
            $sdkRepoPath = $parent
        }
        
        Write-Host "Found azure-sdk-for-net root: $sdkRepoPath" -ForegroundColor Gray
        Write-Host ""
        
        # Step 3: Update artifacts and build required generators
        Write-Host "`n[3/5] Updating artifacts and building generators..." -ForegroundColor Cyan
        
        $packagesDataPropsPath = Join-Path $sdkRepoPath "eng" "Packages.Data.props"
        $propsContent = Get-Content $packagesDataPropsPath -Raw
        $pattern = '(<UnbrandedGeneratorVersion>)([^<]+)(</UnbrandedGeneratorVersion>)'
        
        if ($propsContent -match $pattern) {
            $oldVersion = $Matches[2]
            $newContent = $propsContent -replace $pattern, "<UnbrandedGeneratorVersion>$localVersion</UnbrandedGeneratorVersion>"
            Set-Content $packagesDataPropsPath -Value $newContent -Encoding utf8 -NoNewline
            Write-Host "  Updated UnbrandedGeneratorVersion to $localVersion" -ForegroundColor Green
        }
        
        $nugetConfigPath = Join-Path $sdkRepoPath "NuGet.Config"
        Add-LocalNuGetSource -NuGetConfigPath $nugetConfigPath -SourcePath $debugFolder
        
        # Clear NuGet cache to ensure fresh package discovery
        Write-Host "Clearing NuGet HTTP cache..." -ForegroundColor Gray
        $clearCacheCmd = "dotnet nuget locals http-cache --clear"
        Invoke $clearCacheCmd $sdkRepoPath | Out-Host
        Write-Host "  NuGet cache cleared" -ForegroundColor Green
        
        $engFolder = Join-Path $sdkRepoPath "eng"
        $tempDir = Join-Path $engFolder "temp-package-update"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        try {
            $emitterJson = Join-Path $engFolder "http-client-csharp-emitter-package.json"
            $tempPackageJson = Join-Path $tempDir "package.json"
            
            Copy-Item $emitterJson $tempPackageJson -Force
            
            # Copy the package file to temp directory to avoid Windows path length issues
            $packageFileName = Split-Path $unbrandedPackagePath -Leaf
            $tempPackageFile = Join-Path $tempDir $packageFileName
            Copy-Item $unbrandedPackagePath $tempPackageFile -Force
            
            Push-Location $tempDir
            try {
                Invoke "npm install `"`"file:$packageFileName`"`" --package-lock-only" $tempDir
                
                Copy-Item $tempPackageJson $emitterJson -Force
                $lockFile = Join-Path $tempDir "package-lock.json"
                if (Test-Path $lockFile) {
                    Copy-Item $lockFile (Join-Path $engFolder "http-client-csharp-emitter-package-lock.json") -Force
                }
            }
            finally {
                Pop-Location
            }
        }
        finally {
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        if ($needsAzure) {
            Write-Host "Building Azure generator..." -ForegroundColor Gray
            
            $azureGeneratorPath = Join-Path $sdkRepoPath "eng" "packages" "http-client-csharp"
            
            $azurePackagePath = Update-AzureGenerator `
                -AzureGeneratorPath $azureGeneratorPath `
                -UnbrandedPackagePath $unbrandedPackagePath `
                -DebugFolder $debugFolder `
                -PackagesDataPropsPath $packagesDataPropsPath `
                -LocalVersion $localVersion
            
            $tempDir = Join-Path $engFolder "temp-azure-update"
            New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
            
            try {
                $emitterJson = Join-Path $engFolder "azure-typespec-http-client-csharp-emitter-package.json"
                $tempPackageJson = Join-Path $tempDir "package.json"
                
                Copy-Item $emitterJson $tempPackageJson -Force
                
                # Copy the package file to temp directory to avoid Windows path length issues
                $azurePackageFileName = Split-Path $azurePackagePath -Leaf
                $tempAzurePackageFile = Join-Path $tempDir $azurePackageFileName
                Copy-Item $azurePackagePath $tempAzurePackageFile -Force
                
                Push-Location $tempDir
                try {
                    Invoke "npm install `"`"file:$azurePackageFileName`"`" --package-lock-only" $tempDir
                    
                    Copy-Item $tempPackageJson $emitterJson -Force
                    $lockFile = Join-Path $tempDir "package-lock.json"
                    if (Test-Path $lockFile) {
                        Copy-Item $lockFile (Join-Path $engFolder "azure-typespec-http-client-csharp-emitter-package-lock.json") -Force
                    }
                }
                finally {
                    Pop-Location
                }
            }
            finally {
                Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
            }
            
            Write-Host "  Azure generator completed" -ForegroundColor Green
        }
        
        if ($needsMgmt) {
            Write-Host "Building management plane generator..." -ForegroundColor Gray
            
            Update-MgmtGenerator `
                -EngFolder $engFolder `
                -DebugFolder $debugFolder `
                -LocalVersion $localVersion
            
            Write-Host "  Management plane generator completed" -ForegroundColor Green
        }
        
        # Step 4: Run code generation
        Write-Host "`n[4/5] Running code generation..." -ForegroundColor Cyan
        Invoke-CodeGeneration -SdkPath $sdkPath -IsOpenAI $false
        
        # Step 5: Add debug profile
        Write-Host "`n[5/5] Adding debug profile..." -ForegroundColor Cyan
        $profileName = Add-DebugProfile -SdkPath $sdkPath -EmitterPackage $emitterPackage -IsOpenAI $false
        
        # Restore artifacts
        Write-Host "`nRestoring modified artifacts..." -ForegroundColor Cyan
        Push-Location $sdkRepoPath
        try {
            $filesToRestore = @(
                "eng/azure-typespec-http-client-csharp-emitter-package.json"
                "eng/azure-typespec-http-client-csharp-emitter-package-lock.json"
                "eng/http-client-csharp-emitter-package.json"
                "eng/http-client-csharp-emitter-package-lock.json"
                "eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json"
                "eng/azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json"
                "eng/packages/http-client-csharp/package-lock.json"
                "eng/packages/http-client-csharp-mgmt/package.json"
                "eng/packages/http-client-csharp-mgmt/package-lock.json"
                "eng/Packages.Data.props"
                "NuGet.Config"
            )
            $restoreCmd = "git restore $($filesToRestore -join ' ')"
            Invoke $restoreCmd $sdkRepoPath
            Write-Host "  All artifacts restored" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to restore some artifacts: $_"
        }
        finally {
            Pop-Location
        }
    }
    
    Write-Host "`n=============================================================" -ForegroundColor Cyan
    Write-Host "Setup completed successfully!" -ForegroundColor Green
    Write-Host "You can now debug the '$profileName' profile in Visual Studio or VS Code." -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Error "Error: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    exit 1
}
