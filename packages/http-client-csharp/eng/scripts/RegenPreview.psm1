Import-Module "$PSScriptRoot\Generation.psm1" -DisableNameChecking -Force -Global

function Update-GeneratorPackage {
    <#
    .SYNOPSIS
        Common helper function to update, build, and package a TypeSpec generator.

    .DESCRIPTION
        This internal function handles the common workflow for updating TypeSpec generators:
        1. Updates package.json dependencies
        2. Runs npm install
        3. Runs npm clean to ensure a clean build
        4. Builds the generator
        5. Packages the generator with specified version
        6. Moves package to debug folder
        
        This is a shared helper used by Update-MgmtGenerator and Update-AzureGenerator.

    .PARAMETER GeneratorPath
        Path to the generator directory.

    .PARAMETER Dependencies
        Hashtable of dependencies to update (name -> file path).

    .PARAMETER DevDependencies
        Hashtable of dev dependencies to update (name -> file path).

    .PARAMETER LocalVersion
        The version string to use for the package.

    .PARAMETER DebugFolder
        The debug folder where the package should be moved.

    .PARAMETER UseNpmCi
        If true, runs 'npm install --package-lock-only && npm ci' instead of 'npm install'.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$GeneratorPath,
        
        [Parameter(Mandatory=$false)]
        [hashtable]$Dependencies = @{},
        
        [Parameter(Mandatory=$false)]
        [hashtable]$DevDependencies = @{},
        
        [Parameter(Mandatory=$true)]
        [string]$LocalVersion,
        
        [Parameter(Mandatory=$true)]
        [string]$DebugFolder,
        
        [Parameter(Mandatory=$false)]
        [bool]$UseNpmCi = $false
    )

    $ErrorActionPreference = 'Stop'

    $packageJsonPath = Join-Path $GeneratorPath "package.json"
    $originalPackageJson = Get-Content $packageJsonPath -Raw

    try {
        # Step 1: Update package.json dependencies
        if ($Dependencies.Count -gt 0 -or $DevDependencies.Count -gt 0) {
            Write-Host "Updating package.json dependencies..." -ForegroundColor Gray
            $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
            
            foreach ($dep in $Dependencies.GetEnumerator()) {
                if ($packageJson.dependencies -and $packageJson.dependencies.PSObject.Properties[$dep.Key]) {
                    $packageJson.dependencies.($dep.Key) = "file:$($dep.Value)"
                }
            }
            
            foreach ($dep in $DevDependencies.GetEnumerator()) {
                if ($packageJson.devDependencies -and $packageJson.devDependencies.PSObject.Properties[$dep.Key]) {
                    $packageJson.devDependencies.($dep.Key) = "file:$($dep.Value)"
                }
            }
            
            $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding UTF8
            Write-Host "  Updated dependencies to local packages" -ForegroundColor Green
        }

        # Step 2: Install dependencies, clean, and build.
        # Force the default registry to the public azure-sdk-for-js feed.
        Push-Location $GeneratorPath
        try {
            Write-Host "Installing dependencies..." -ForegroundColor Gray
            if ($UseNpmCi) {
                $installOutput = & npm install --package-lock-only --registry https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/ 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Host $installOutput -ForegroundColor Red
                    throw "Failed to update package-lock.json"
                }
                
                $ciOutput = & npm ci --registry https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/ 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Host $ciOutput -ForegroundColor Red
                    throw "Failed to install dependencies"
                }
            } else {
                $installOutput = & npm install --registry https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/ 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Host $installOutput -ForegroundColor Red
                    throw "Failed to run npm install"
                }
            }

            Write-Host "Cleaning build artifacts..." -ForegroundColor Gray
            $cleanOutput = Invoke "npm run clean" $GeneratorPath
            if ($LASTEXITCODE -ne 0) {
                Write-Host $cleanOutput -ForegroundColor Red
                throw "Failed to clean generator"
            }

            Write-Host "Building generator..." -ForegroundColor Gray
            $buildOutput = Invoke "npm run build" $GeneratorPath
            if ($LASTEXITCODE -ne 0) {
                Write-Host $buildOutput -ForegroundColor Red
                throw "Failed to build generator"
            }
            
            Write-Host "  Build completed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }

        # Step 3: Package the generator
        Write-Host "Packaging generator..." -ForegroundColor Gray
        
        # Update version in package.json for packaging
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        $packageJson.version = $LocalVersion
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding UTF8

        Push-Location $GeneratorPath
        try {
            $packOutput = Invoke "npm pack" $GeneratorPath
            if ($LASTEXITCODE -ne 0) {
                Write-Host $packOutput -ForegroundColor Red
                throw "Failed to pack generator"
            }
            
            # Get the package filename
            $packageLine = ($packOutput | Where-Object { $_ -match '\.tgz$' } | Select-Object -First 1).ToString().Trim()
            if ($packageLine -match 'filename:\s*(.+\.tgz)') {
                $packageFile = $Matches[1].Trim()
            } else {
                $packageFile = $packageLine
            }
            
            # Move to debug folder
            $sourcePath = Join-Path $GeneratorPath $packageFile
            $destPath = Join-Path $DebugFolder $packageFile
            Move-Item $sourcePath $destPath -Force
            
            Write-Host "  Package created: $packageFile" -ForegroundColor Green
            
            return $destPath
        }
        finally {
            Pop-Location
        }
    }
    finally {
        # Always restore original package.json
        Set-Content $packageJsonPath $originalPackageJson -Encoding utf8 -NoNewline
    }
}

function Update-MgmtGenerator {
    <#
    .SYNOPSIS
        Updates and builds the management plane generator (@azure-typespec/http-client-csharp-mgmt).

    .DESCRIPTION
        This function handles the management plane generator setup:
        1. Redirects the mgmt generator's "dependencies" for both @azure-typespec/http-client-csharp
           and @typespec/http-client-csharp to the locally built packages
        2. Runs npm install
        3. Runs npm run clean to ensure a clean build
        4. Builds the management plane generator
        5. Packages the management plane generator
        6. Updates eng folder emitter package artifacts (azure-typespec-http-client-csharp-mgmt-emitter-package.json)
           and regenerates the lock file with the full local dependency graph (mgmt + Azure + unbranded)
        
        This function is designed to be called from RegenPreview.ps1 and uses the same
        versioning scheme as the main generators. It derives all necessary paths from the
        EngFolder parameter.

    .PARAMETER EngFolder
        The eng folder path in azure-sdk-for-net. All other paths (mgmt generator, 
        package paths, Directory.Generation.Packages.props) are derived from this.

    .PARAMETER DebugFolder
        The debug folder path where the packaged generators (.tgz files) are located.

    .PARAMETER LocalVersion
        The version string to use for the local package (e.g., "1.0.0-alpha.20250127.abc123").
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$EngFolder,
        
        [Parameter(Mandatory=$true)]
        [string]$DebugFolder,
        
        [Parameter(Mandatory=$true)]
        [string]$LocalVersion
    )

    $ErrorActionPreference = 'Stop'

    # Derive all paths from EngFolder
    $mgmtGeneratorPath = Join-Path $EngFolder "packages" "http-client-csharp-mgmt"
    
    # Package paths come from debug folder
    $azurePackageName = "azure-typespec-http-client-csharp-$LocalVersion.tgz"
    $unbrandedPackageName = "typespec-http-client-csharp-$LocalVersion.tgz"
    $azurePackagePath = Join-Path $DebugFolder $azurePackageName
    $unbrandedPackagePath = Join-Path $DebugFolder $unbrandedPackageName
    
    if (-not (Test-Path $azurePackagePath)) {
        throw "Azure package not found: $azurePackagePath"
    }
    if (-not (Test-Path $unbrandedPackagePath)) {
        throw "Unbranded package not found: $unbrandedPackagePath"
    }

    Write-Host "Management plane generator path: $mgmtGeneratorPath" -ForegroundColor Gray
    Write-Host "Azure package: $azurePackagePath" -ForegroundColor Gray
    Write-Host "Unbranded package: $unbrandedPackagePath" -ForegroundColor Gray
    Write-Host "Local version: $LocalVersion" -ForegroundColor Gray
    Write-Host ""

    # Use shared helper to build and package the mgmt generator.
    # The mgmt generator declares BOTH the Azure and unbranded generators under
    # "dependencies" (not devDependencies), so both must be redirected to the locally
    # built packages before packing. Otherwise the packed mgmt emitter would still
    # reference the published Azure/unbranded versions instead of the local builds.
    $mgmtPackagePath = Update-GeneratorPackage `
        -GeneratorPath $mgmtGeneratorPath `
        -Dependencies @{
            '@azure-typespec/http-client-csharp' = $azurePackagePath
            '@typespec/http-client-csharp'       = $unbrandedPackagePath
        } `
        -LocalVersion $LocalVersion `
        -DebugFolder $DebugFolder `
        -UseNpmCi $false

    # Update eng folder mgmt emitter package artifacts.
    # The emitter package only declares @azure-typespec/http-client-csharp-mgmt directly;
    # the Azure + unbranded packages are pulled in transitively from the mgmt tgz, which
    # now points at the local file: packages. Installing the local mgmt tgz regenerates
    # the lock file with the full local dependency graph.
    Write-Host "Updating mgmt emitter package artifacts..." -ForegroundColor Gray
    
    $mgmtEmitterJson = Join-Path $EngFolder "azure-typespec-http-client-csharp-mgmt-emitter-package.json"
    
    # Regenerate the package-lock.json with the full (local) dependency graph
    $tempDir = Join-Path $EngFolder "temp-mgmt-package-update"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Point the default registry at the public azure-sdk-for-js feed so dependency
    # resolution doesn't fall back to the authenticated machine-global proxy
    # (packagefeedproxy), which fails with E401 for @typespec/@azure-tools packages.
    Set-Content (Join-Path $tempDir ".npmrc") "registry=https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/`n" -Encoding utf8
    
    try {
        $tempPackageJson = Join-Path $tempDir "package.json"
        
        Copy-Item $mgmtEmitterJson $tempPackageJson -Force
        
        Push-Location $tempDir
        try {
            # Install the mgmt package and regenerate lock file with both dependencies
            Invoke "npm install `"`"file:$mgmtPackagePath`"`" --package-lock-only" $tempDir
            
            Copy-Item $tempPackageJson $mgmtEmitterJson -Force
            $lockFile = Join-Path $tempDir "package-lock.json"
            if (Test-Path $lockFile) {
                $mgmtLockJson = Join-Path $EngFolder "azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json"
                Copy-Item $lockFile $mgmtLockJson -Force
            }
            
            Write-Host "  Mgmt emitter package artifacts updated" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }
    finally {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host ""

    # Return the package path for potential further use
    return $mgmtPackagePath
}

function Update-AzureGenerator {
    <#
    .SYNOPSIS
        Updates and builds the Azure generator (@azure-typespec/http-client-csharp).

    .DESCRIPTION
        This function handles the Azure generator setup:
        1. Updates package.json to use local unbranded generator dependency
        2. Runs npm clean, install, and build
        3. Packages the Azure generator
        4. Builds and packages the Azure.Generator NuGet package
        5. Updates Directory.Generation.Packages.props with AzureGeneratorVersion
        
        This function is designed to be called from RegenPreview.ps1.

    .PARAMETER AzureGeneratorPath
        Path to the Azure generator directory in azure-sdk-for-net.

    .PARAMETER UnbrandedPackagePath
        Path to the local unbranded TypeSpec emitter package (.tgz).

    .PARAMETER DebugFolder
        The debug folder path where packaged artifacts will be stored.

    .PARAMETER PackagesDataPropsPath
        Path to the Directory.Generation.Packages.props file.

    .PARAMETER LocalVersion
        The version string to use for the local package (e.g., "1.0.0-alpha.20250127.abc123").
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$AzureGeneratorPath,
        
        [Parameter(Mandatory=$true)]
        [string]$UnbrandedPackagePath,
        
        [Parameter(Mandatory=$true)]
        [string]$DebugFolder,
        
        [Parameter(Mandatory=$true)]
        [string]$PackagesDataPropsPath,
        
        [Parameter(Mandatory=$true)]
        [string]$LocalVersion
    )

    $ErrorActionPreference = 'Stop'

    Write-Host "Azure generator path: $AzureGeneratorPath" -ForegroundColor Gray
    Write-Host "Unbranded package: $UnbrandedPackagePath" -ForegroundColor Gray
    Write-Host "Local version: $LocalVersion" -ForegroundColor Gray
    Write-Host ""

    # Use shared helper to build and package the Azure generator
    $azurePackagePath = Update-GeneratorPackage `
        -GeneratorPath $AzureGeneratorPath `
        -Dependencies @{ '@typespec/http-client-csharp' = $UnbrandedPackagePath } `
        -LocalVersion $LocalVersion `
        -DebugFolder $DebugFolder `
        -UseNpmCi $true

    # Build and package Azure.Generator NuGet package
    Write-Host "Packing Azure.Generator NuGet package..." -ForegroundColor Gray
    
    $azureGeneratorCsprojPath = Join-Path $AzureGeneratorPath "generator" "Azure.Generator" "src" "Azure.Generator.csproj"
    if (-not (Test-Path $azureGeneratorCsprojPath)) {
        throw "Azure.Generator project not found at: $azureGeneratorCsprojPath"
    }
    $packCmd = "dotnet pack `"$azureGeneratorCsprojPath`" /p:Version=$LocalVersion /p:PackageVersion=$LocalVersion /p:PackageOutputPath=`"$DebugFolder`" /p:HasReleaseVersion=`"false`" --configuration Debug --no-build --nologo -v:quiet"
    Invoke $packCmd $AzureGeneratorPath    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to pack Azure.Generator"
    }
    
    Write-Host "  Azure.Generator NuGet package created" -ForegroundColor Green

    # Update Directory.Generation.Packages.props with Azure generator version
    Write-Host "Updating Directory.Generation.Packages.props..." -ForegroundColor Gray
    $propsContent = Get-Content $PackagesDataPropsPath -Raw
    $pattern = '(<AzureGeneratorVersion>)([^<]+)(</AzureGeneratorVersion>)'
    
    if ($propsContent -match $pattern) {
        $oldVersion = $Matches[2]
        $newContent = $propsContent -replace $pattern, "<AzureGeneratorVersion>$LocalVersion</AzureGeneratorVersion>"
        Set-Content $PackagesDataPropsPath -Value $newContent -Encoding utf8 -NoNewline
        Write-Host "  Updated AzureGeneratorVersion from $oldVersion to $LocalVersion" -ForegroundColor Green
    } else {
        throw "AzureGeneratorVersion property not found in $PackagesDataPropsPath"
    }

    Write-Host ""

    # Return the package path for potential further use
    return $azurePackagePath
}

function Filter-LibrariesByGenerator {
    <#
    .SYNOPSIS
        Filters libraries based on generator type.

    .DESCRIPTION
        This function filters a list of libraries based on the specified generator type.
        Each library object should have a 'Generator' property.
        If no generator filter is specified, all libraries are returned.

    .PARAMETER Libraries
        Array of library objects to filter. Each object should have a 'Generator' property.

    .PARAMETER Azure
        Filter for Azure generator (@azure-typespec/http-client-csharp).

    .PARAMETER Unbranded
        Filter for unbranded generator (@typespec/http-client-csharp).

    .PARAMETER Mgmt
        Filter for management plane generator (@azure-typespec/http-client-csharp-mgmt).
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Libraries,
        
        [Parameter(Mandatory=$false)]
        [switch]$Azure,
        
        [Parameter(Mandatory=$false)]
        [switch]$Unbranded,
        
        [Parameter(Mandatory=$false)]
        [switch]$Mgmt
    )

    $ErrorActionPreference = 'Stop'

    # If no filters specified, return everything as an array
    if (-not $Azure -and -not $Unbranded -and -not $Mgmt) {
        return @($Libraries)
    }

    # Filter based on specified generator type
    $filtered = [System.Collections.ArrayList]::new()
    
    if ($Azure) {
        $azureLibs = @($Libraries | Where-Object { $_.Generator -eq "@azure-typespec/http-client-csharp" })
        foreach ($lib in $azureLibs) {
            [void]$filtered.Add($lib)
        }
    }
    
    if ($Unbranded) {
        $unbrandedLibs = @($Libraries | Where-Object { $_.Generator -eq "@typespec/http-client-csharp" })
        foreach ($lib in $unbrandedLibs) {
            [void]$filtered.Add($lib)
        }
    }
    
    if ($Mgmt) {
        $mgmtLibs = @($Libraries | Where-Object { $_.Generator -eq "@azure-typespec/http-client-csharp-mgmt" })
        foreach ($lib in $mgmtLibs) {
            [void]$filtered.Add($lib)
        }
    }

    # Return as array to ensure Count property is always available
    return @($filtered.ToArray())
}

function Filter-LibrariesByName {
    <#
    .SYNOPSIS
        Filters libraries by name.

    .PARAMETER Libraries
        Array of library objects to filter. Each object should have a 'Library' property.

    .PARAMETER LibraryNames
        Names of the libraries to include. If no names are specified, all libraries are returned.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$Libraries,

        [Parameter(Mandatory=$false)]
        [string[]]$LibraryNames
    )

    $ErrorActionPreference = 'Stop'

    if (-not $LibraryNames -or $LibraryNames.Count -eq 0) {
        return @($Libraries)
    }

    return @($Libraries | Where-Object { $_.Library -in $LibraryNames })
}

function Update-OpenAIGenerator {
    <#
    .SYNOPSIS
        Updates and regenerates the OpenAI .NET library using local generators.

    .DESCRIPTION
        This function handles the OpenAI generator workflow:
        1. Updates codegen/nuget.config with local NuGet package source
        2. Updates codegen/package.json with local unbranded generator dependency
        3. Updates OpenAI.Library.Plugin.csproj with local NuGet package version
        4. Invokes Invoke-CodeGen.ps1 with Clean option to regenerate the library
        
        This function is designed to be called from RegenPreview.ps1 for OpenAI repositories.

    .PARAMETER OpenAIRepoPath
        Path to the openai-dotnet repository root.

    .PARAMETER UnbrandedPackagePath
        Path to the local unbranded TypeSpec emitter package (.tgz).

    .PARAMETER LocalVersion
        The version string to use for the local package (e.g., "1.0.0-alpha.20250127.abc123").

    .PARAMETER DebugFolder
        The debug folder path where NuGet packages are located.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$OpenAIRepoPath,
        
        [Parameter(Mandatory=$true)]
        [string]$UnbrandedPackagePath,
        
        [Parameter(Mandatory=$true)]
        [string]$LocalVersion,
        
        [Parameter(Mandatory=$true)]
        [string]$DebugFolder
    )

    $ErrorActionPreference = 'Stop'

    Write-Host "OpenAI repository path: $OpenAIRepoPath" -ForegroundColor Gray
    Write-Host "Unbranded package: $UnbrandedPackagePath" -ForegroundColor Gray
    Write-Host "Local version: $LocalVersion" -ForegroundColor Gray
    Write-Host ""

    # Update root nuget.config (not codegen/nuget.config)
    # OpenAI uses packageSourceMapping, so we need to add patterns for the generator packages
    $nugetConfigPath = Join-Path $OpenAIRepoPath "nuget.config"
    Add-LocalNuGetSource `
        -NuGetConfigPath $nugetConfigPath `
        -SourcePath $DebugFolder `
        -PackagePatterns @(
            "Microsoft.TypeSpec.Generator.ClientModel",
            "Microsoft.TypeSpec.Generator.Input"
            "Microsoft.TypeSpec.Generator"
        )

    # Update codegen/package.json
    $codegenPackageJsonPath = Join-Path $OpenAIRepoPath "codegen" "package.json"
    if (-not (Test-Path $codegenPackageJsonPath)) {
        throw "OpenAI codegen package.json not found: $codegenPackageJsonPath"
    }

    Write-Host "Updating OpenAI codegen package.json..." -ForegroundColor Gray
    $originalPackageJson = Get-Content $codegenPackageJsonPath -Raw
    
    try {
        $packageJson = $originalPackageJson | ConvertFrom-Json
        
        # Update dependencies or devDependencies with local unbranded generator
        $updated = $false
        
        if ($packageJson.dependencies -and $packageJson.dependencies.PSObject.Properties['@typespec/http-client-csharp']) {
            $packageJson.dependencies.'@typespec/http-client-csharp' = "file:$UnbrandedPackagePath"
            $updated = $true
            Write-Host "  Updated @typespec/http-client-csharp in dependencies to local package" -ForegroundColor Green
        }
        
        if ($packageJson.devDependencies -and $packageJson.devDependencies.PSObject.Properties['@typespec/http-client-csharp']) {
            $packageJson.devDependencies.'@typespec/http-client-csharp' = "file:$UnbrandedPackagePath"
            $updated = $true
            Write-Host "  Updated @typespec/http-client-csharp in devDependencies to local package" -ForegroundColor Green
        }
        
        if (-not $updated) {
            throw "@typespec/http-client-csharp not found in dependencies or devDependencies"
        }
        
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $codegenPackageJsonPath -Encoding UTF8

        # Remove stale node_modules and package-lock.json to ensure clean dependency resolution
        Write-Host "Removing stale node_modules and package-lock.json..." -ForegroundColor Gray
        $rootNodeModules = Join-Path $OpenAIRepoPath "node_modules"
        if (Test-Path $rootNodeModules) {
            Remove-Item $rootNodeModules -Recurse -Force
        }
        $codegenNodeModules = Join-Path $OpenAIRepoPath "codegen" "node_modules"
        if (Test-Path $codegenNodeModules) {
            Remove-Item $codegenNodeModules -Recurse -Force
        }
        $packageLockPath = Join-Path $OpenAIRepoPath "package-lock.json"
        if (Test-Path $packageLockPath) {
            Write-Host "Deleting package-lock.json..." -ForegroundColor Gray
            Remove-Item $packageLockPath -Force
        }

        # Install dependencies
        Write-Host "Installing dependencies..." -ForegroundColor Gray
        Push-Location $OpenAIRepoPath
        try {
            $npmOutput = Invoke "npm install --registry https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/" $OpenAIRepoPath
            if ($LASTEXITCODE -ne 0) {
                Write-Host $npmOutput -ForegroundColor Red
                throw "npm install failed"
            }
            Write-Host "  Dependencies installed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }

        # Update Directory.Packages.props
        $directoryPackagesPropsPath = Join-Path $OpenAIRepoPath "Directory.Packages.props"
        if (-not (Test-Path $directoryPackagesPropsPath)) {
            throw "Directory.Packages.props not found: $directoryPackagesPropsPath"
        }

        Write-Host "Updating Directory.Packages.props..." -ForegroundColor Gray
        $propsContent = Get-Content $directoryPackagesPropsPath -Raw
        $pattern = '(<PackageVersion\s+Include="Microsoft\.TypeSpec\.Generator\.ClientModel"\s+Version=")([^"]+)(")'
        
        if ($propsContent -match $pattern) {
            $oldVersion = $Matches[2]
            $newContent = $propsContent -replace $pattern, "`${1}$LocalVersion`${3}"
            Set-Content $directoryPackagesPropsPath -Value $newContent -Encoding utf8 -NoNewline
            Write-Host "  Updated Microsoft.TypeSpec.Generator.ClientModel from $oldVersion to $LocalVersion" -ForegroundColor Green
        } else {
            throw "Microsoft.TypeSpec.Generator.ClientModel PackageVersion not found in Directory.Packages.props"
        }

        # Invoke Invoke-CodeGen.ps1 with Clean option
        $codeGenScript = Join-Path $OpenAIRepoPath "scripts" "Invoke-CodeGen.ps1"
        if (-not (Test-Path $codeGenScript)) {
            throw "Invoke-CodeGen.ps1 not found: $codeGenScript"
        }

        Write-Host "Generating OpenAI library code..." -ForegroundColor Gray
        Push-Location $OpenAIRepoPath
        try {
            $output = & $codeGenScript -Clean 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host $output -ForegroundColor Red
                throw "OpenAI code generation failed"
            }
            Write-Host "  OpenAI library regenerated successfully" -ForegroundColor Green
            
            # Store output for return
            $generationOutput = $output -join "`n"
        }
        finally {
            Pop-Location
        }

        # On successful regeneration, restore all modified artifacts
        Write-Host "Restoring modified artifacts..." -ForegroundColor Gray
        Push-Location $OpenAIRepoPath
        try {
            $filesToRestore = @(
                "codegen/package.json"
                "package-lock.json"
                "nuget.config"
                "Directory.Packages.props"
            )
            $restoreCmd = "git restore $($filesToRestore -join ' ')"
            Invoke $restoreCmd $OpenAIRepoPath

            Write-Host "  All artifacts restored" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to restore some artifacts: $_"
        }
        finally {
            Pop-Location
        }
    }
    finally {
        Pop-Location
    }

    Write-Host ""
    
    # Return the generation output for reporting
    return $generationOutput
}

function Add-LocalNuGetSource {
    <#
    .SYNOPSIS
        Adds a local NuGet package source to NuGet.Config.

    .DESCRIPTION
        This function adds or updates a local NuGet package source in the repository's NuGet.Config file.
        The source is inserted after the <clear /> element if present, or appended otherwise.
        
        If PackagePatterns is provided, it also updates packageSourceMapping to allow the specified
        packages to be loaded from the local source. This is required for repos that use package source mapping.
        
        This is a shared helper used by both Azure SDK and OpenAI workflows.

    .PARAMETER NuGetConfigPath
        Path to the NuGet.Config file.

    .PARAMETER SourcePath
        Path to the local NuGet package source directory.

    .PARAMETER SourceKey
        The key/name for the NuGet source (default: "local-codegen-debug-packages").

    .PARAMETER PackagePatterns
        Optional array of package patterns to add to packageSourceMapping for this source.
        Example: @("Microsoft.TypeSpec.Generator*", "Azure.Generator")
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$NuGetConfigPath,
        
        [Parameter(Mandatory=$true)]
        [string]$SourcePath,
        
        [Parameter(Mandatory=$false)]
        [string]$SourceKey = "local-codegen-debug-packages",
        
        [Parameter(Mandatory=$false)]
        [string[]]$PackagePatterns = @()
    )

    $ErrorActionPreference = 'Stop'

    if (-not (Test-Path $NuGetConfigPath)) {
        throw "NuGet.Config not found at: $NuGetConfigPath"
    }

    Write-Host "Adding local NuGet package source to NuGet.Config..." -ForegroundColor Gray
    [xml]$nugetConfig = Get-Content $NuGetConfigPath
    
    # Ensure configuration element exists
    if (-not $nugetConfig.configuration) {
        throw "Invalid NuGet.Config: missing <configuration> element"
    }
    
    # Ensure packageSources element exists, create if needed
    $packageSources = $nugetConfig.configuration.packageSources
    if (-not $packageSources) {
        $packageSources = $nugetConfig.CreateElement("packageSources")
        $nugetConfig.configuration.AppendChild($packageSources) | Out-Null
    }
    
    # Create local source element
    $localSource = $nugetConfig.CreateElement("add")
    $localSource.SetAttribute("key", $SourceKey)
    $localSource.SetAttribute("value", $SourcePath)
    
    # Find the <clear /> element and insert after it
    $clearElement = $packageSources.ChildNodes | Where-Object { $_.Name -eq "clear" } | Select-Object -First 1
    
    if ($clearElement -and $clearElement.NextSibling) {
        $packageSources.InsertBefore($localSource, $clearElement.NextSibling) | Out-Null
    } elseif ($clearElement) {
        $packageSources.AppendChild($localSource) | Out-Null
    } else {
        # No clear element, just prepend to be first
        if ($packageSources.FirstChild) {
            $packageSources.InsertBefore($localSource, $packageSources.FirstChild) | Out-Null
        } else {
            $packageSources.AppendChild($localSource) | Out-Null
        }
    }
    
    Write-Host "  Added local NuGet source: $SourceKey" -ForegroundColor Green
    
    # Handle packageSourceMapping if PackagePatterns are provided
    if ($PackagePatterns.Count -gt 0) {
        Write-Host "  Updating packageSourceMapping..." -ForegroundColor Gray
        
        $packageSourceMapping = $nugetConfig.configuration.packageSourceMapping
        if (-not $packageSourceMapping) {
            $packageSourceMapping = $nugetConfig.CreateElement("packageSourceMapping")
            $nugetConfig.configuration.AppendChild($packageSourceMapping) | Out-Null
        }
        
        # Find or create packageSource element for our local source
        $localPackageSource = $packageSourceMapping.packageSource | Where-Object { $_.key -eq $SourceKey } | Select-Object -First 1
        
        if (-not $localPackageSource) {
            $localPackageSource = $nugetConfig.CreateElement("packageSource")
            $localPackageSource.SetAttribute("key", $SourceKey)
            
            # Insert at the beginning of packageSourceMapping (highest priority)
            if ($packageSourceMapping.FirstChild) {
                $packageSourceMapping.InsertBefore($localPackageSource, $packageSourceMapping.FirstChild) | Out-Null
            } else {
                $packageSourceMapping.AppendChild($localPackageSource) | Out-Null
            }
        }
        
        # Add package patterns
        foreach ($pattern in $PackagePatterns) {
            $packageElement = $nugetConfig.CreateElement("package")
            $packageElement.SetAttribute("pattern", $pattern)
            $localPackageSource.AppendChild($packageElement) | Out-Null
            Write-Host "    Added pattern: $pattern" -ForegroundColor Green
        }
    }
    
    $nugetConfig.Save($NuGetConfigPath)
}

function Update-AzureSpectorScenarios {
    <#
    .SYNOPSIS
        Regenerates Azure spector test scenarios using local unbranded generator changes.

    .DESCRIPTION
        This function handles the Azure spector regeneration workflow:
        1. Updates Directory.Generation.Packages.props with local NuGet version and adds local NuGet source
        2. Temporarily updates the Azure generator's package.json to use the local unbranded package
        3. Runs npm install to wire up the local dependency
        4. Invokes the Azure generator's Generate.ps1 to regenerate spector scenarios
        5. Restores all modified files to their original state
        
        This allows validating that local changes to the unbranded generator (both the TypeScript 
        emitter and the C# generator framework) don't break the Azure generator's spector test scenarios.

    .PARAMETER AzureGeneratorPath
        Path to the Azure generator directory in azure-sdk-for-net (eng/packages/http-client-csharp).

    .PARAMETER UnbrandedPackagePath
        Path to the local unbranded TypeSpec emitter package (.tgz).

    .PARAMETER LocalVersion
        The version string used for the local NuGet packages.

    .PARAMETER DebugFolder
        The debug folder path where local NuGet packages are located.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$AzureGeneratorPath,
        
        [Parameter(Mandatory=$true)]
        [string]$UnbrandedPackagePath,
        
        [Parameter(Mandatory=$true)]
        [string]$LocalVersion,
        
        [Parameter(Mandatory=$true)]
        [string]$DebugFolder
    )

    $ErrorActionPreference = 'Stop'

    # Derive the azure-sdk-for-net root from the Azure generator path (eng/packages/http-client-csharp)
    $sdkRepoPath = Resolve-Path (Join-Path $AzureGeneratorPath ".." ".." "..")

    Write-Host "Azure generator path: $AzureGeneratorPath" -ForegroundColor Gray
    Write-Host "Unbranded package: $UnbrandedPackagePath" -ForegroundColor Gray
    Write-Host "Local NuGet version: $LocalVersion" -ForegroundColor Gray
    Write-Host ""

    $packageJsonPath = Join-Path $AzureGeneratorPath "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        throw "Azure generator package.json not found: $packageJsonPath"
    }

    $originalPackageJson = Get-Content $packageJsonPath -Raw

    # Save original Directory.Generation.Packages.props content for restore
    $packagesDataPropsPath = Join-Path $sdkRepoPath "eng" "centralpackagemanagement" "Directory.Generation.Packages.props"
    $originalPackagesDataProps = $null
    if (Test-Path $packagesDataPropsPath) {
        $originalPackagesDataProps = Get-Content $packagesDataPropsPath -Raw
    }

    # Save original NuGet.Config content for restore
    $nugetConfigPath = Join-Path $sdkRepoPath "NuGet.Config"
    $originalNugetConfig = $null
    if (Test-Path $nugetConfigPath) {
        $originalNugetConfig = Get-Content $nugetConfigPath -Raw
    }

    try {
        # Step 1: Update Directory.Generation.Packages.props with local NuGet version
        if ($originalPackagesDataProps) {
            Write-Host "Updating Directory.Generation.Packages.props with local NuGet version..." -ForegroundColor Gray
            
            $pattern = '(<UnbrandedGeneratorVersion>)([^<]+)(</UnbrandedGeneratorVersion>)'
            
            if ($originalPackagesDataProps -match $pattern) {
                $newContent = $originalPackagesDataProps -replace $pattern, "<UnbrandedGeneratorVersion>$LocalVersion</UnbrandedGeneratorVersion>"
                Set-Content $packagesDataPropsPath -Value $newContent -Encoding utf8 -NoNewline
                Write-Host "  Updated UnbrandedGeneratorVersion to $LocalVersion" -ForegroundColor Green
            } else {
                throw "UnbrandedGeneratorVersion property not found in $packagesDataPropsPath"
            }
        }

        # Step 2: Add local NuGet source
        if ($originalNugetConfig) {
            Write-Host "Adding local NuGet source..." -ForegroundColor Gray
            Add-LocalNuGetSource -NuGetConfigPath $nugetConfigPath -SourcePath $DebugFolder
        }

        # Step 3: Update package.json to use local unbranded package
        Write-Host "Updating Azure generator to use local unbranded package..." -ForegroundColor Gray
        $packageJson = $originalPackageJson | ConvertFrom-Json

        $updated = $false
        if ($packageJson.dependencies -and $packageJson.dependencies.PSObject.Properties['@typespec/http-client-csharp']) {
            $packageJson.dependencies.'@typespec/http-client-csharp' = "file:$UnbrandedPackagePath"
            $updated = $true
        }
        if ($packageJson.devDependencies -and $packageJson.devDependencies.PSObject.Properties['@typespec/http-client-csharp']) {
            $packageJson.devDependencies.'@typespec/http-client-csharp' = "file:$UnbrandedPackagePath"
            $updated = $true
        }

        if (-not $updated) {
            throw "@typespec/http-client-csharp not found in Azure generator's dependencies or devDependencies"
        }

        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath -Encoding UTF8
        Write-Host "  Updated dependency to local package" -ForegroundColor Green

        # Step 4: Install dependencies
        Write-Host "Installing dependencies..." -ForegroundColor Gray
        Push-Location $AzureGeneratorPath
        try {
            $installOutput = & npm install --registry https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/ 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host $installOutput -ForegroundColor Red
                throw "npm install failed in Azure generator"
            }
            Write-Host "  Dependencies installed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }

        # Step 5: Run the Azure generator's Generate.ps1
        $generateScript = Join-Path $AzureGeneratorPath "eng" "scripts" "Generate.ps1"
        if (-not (Test-Path $generateScript)) {
            throw "Azure generator Generate.ps1 not found: $generateScript"
        }

        Write-Host "Running Azure spector generation..." -ForegroundColor Gray
        Push-Location $AzureGeneratorPath
        try {
            $output = & $generateScript -Stubbed $true 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host $output -ForegroundColor Red
                throw "Azure spector generation failed with exit code $LASTEXITCODE"
            }
            Write-Host "  Spector scenarios regenerated successfully" -ForegroundColor Green
            $generationOutput = $output -join "`n"
        }
        finally {
            Pop-Location
        }
    }
    finally {
        # Restore all modified files from saved originals
        Write-Host "Restoring modified files..." -ForegroundColor Gray
        
        # Restore package.json
        Set-Content $packageJsonPath $originalPackageJson -Encoding utf8 -NoNewline
        
        # Restore Directory.Generation.Packages.props
        if ($originalPackagesDataProps -and (Test-Path $packagesDataPropsPath)) {
            Set-Content $packagesDataPropsPath $originalPackagesDataProps -Encoding utf8 -NoNewline
        }
        
        # Restore NuGet.Config
        if ($originalNugetConfig -and (Test-Path $nugetConfigPath)) {
            Set-Content $nugetConfigPath $originalNugetConfig -Encoding utf8 -NoNewline
        }
        
        # Restore package-lock.json via git (generated file, no original to save)
        Push-Location $AzureGeneratorPath
        try {
            $lockFile = Join-Path $AzureGeneratorPath "package-lock.json"
            if (Test-Path $lockFile) {
                & git restore "package-lock.json" 2>&1 | Out-Null
            }
        }
        catch {
            Write-Warning "Failed to restore package-lock.json: $_"
        }
        finally {
            Pop-Location
        }
        
        Write-Host "  All artifacts restored" -ForegroundColor Green
    }

    Write-Host ""
    return $generationOutput
}

function Get-SdkLibrariesToRegenerate {
    <#
    .SYNOPSIS
        Discovers the SDK libraries in azure-sdk-for-net that are generated by the TypeSpec C# generators.

    .DESCRIPTION
        Scans the sdk directory of the given repository for libraries containing a tsp-location.yaml
        that references one of the TypeSpec C# emitter package json artifacts and returns metadata for
        each matching library (Service, Library, Path and Generator).

    .PARAMETER SdkRepoPath
        Path to the local azure-sdk-for-net repository.

    .PARAMETER EmitterPackageJsonPaths
        Optional. Restricts the results to libraries referencing the specified emitter package json paths
        (for example 'eng/http-client-csharp-emitter-package.json'). When omitted, all known emitters match.

    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$SdkRepoPath,

        [Parameter(Mandatory = $false)]
        [string[]]$EmitterPackageJsonPaths
    )

    $ErrorActionPreference = 'Stop'

    $emitterMap = @{
        'eng/azure-typespec-http-client-csharp-emitter-package.json'      = '@azure-typespec/http-client-csharp'
        'eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json' = '@azure-typespec/http-client-csharp-mgmt'
        'eng/http-client-csharp-emitter-package.json'                     = '@typespec/http-client-csharp'
    }

    if ($EmitterPackageJsonPaths -and $EmitterPackageJsonPaths.Count -gt 0) {
        $unknownEmitters = @($EmitterPackageJsonPaths | Where-Object { -not $emitterMap.ContainsKey($_) })
        if ($unknownEmitters.Count -gt 0) {
            throw "Unknown emitter package json path(s): $($unknownEmitters -join ', ')"
        }

        $filteredMap = @{}
        foreach ($emitterPath in $EmitterPackageJsonPaths) {
            $filteredMap[$emitterPath] = $emitterMap[$emitterPath]
        }
        $emitterMap = $filteredMap
    }

    # Resolves the generator used by a library by inspecting its tsp-location.yaml files
    function Get-GeneratorType {
        param(
            [string]$LibraryPath,
            [hashtable]$EmitterMap
        )

        $tspLocationFiles = Get-ChildItem -Path $LibraryPath -Recurse -Filter "tsp-location.yaml" -ErrorAction SilentlyContinue

        foreach ($tspLocationFile in $tspLocationFiles) {
            try {
                $content = Get-Content $tspLocationFile.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -and $content -match 'emitterPackageJsonPath:\s*(?<val>"[^"]+"|[^,\s]+)\s*,?') {
                    $emitterPath = $matches['val'].Trim('"')

                    if ($EmitterMap.ContainsKey($emitterPath)) {
                        return $EmitterMap[$emitterPath]
                    }
                }
            }
            catch {
                # Continue to next file if error
            }
        }

        return $null
    }

    $libraries = @()
    $sdkRoot = Join-Path $SdkRepoPath "sdk"

    if (-not (Test-Path $sdkRoot)) {
        Write-Warning "SDK directory not found at: $sdkRoot"
        return @()
    }

    # Scan through all service directories
    $serviceDirs = Get-ChildItem -Path $sdkRoot -Directory -Force -ErrorAction SilentlyContinue
    foreach ($serviceDir in $serviceDirs) {
        # Look for library directories
        $libraryDirs = Get-ChildItem -Path $serviceDir.FullName -Directory -Force -ErrorAction SilentlyContinue
        foreach ($libraryDir in $libraryDirs) {
            # Skip directories that don't look like libraries
            if ($libraryDir.Name -in @("tests", "samples", "perf", "assets", "docs")) {
                continue
            }

            # If it has a /src directory, it's likely a library
            $srcPath = Join-Path $libraryDir.FullName "src"
            if (-not (Test-Path $srcPath)) {
                continue
            }

            # Check if this library uses TypeSpec with one of our generators
            $generator = Get-GeneratorType -LibraryPath $libraryDir.FullName -EmitterMap $emitterMap
            if (-not $generator) {
                continue
            }

            # Calculate relative path from SDK repo root
            $relativePath = $libraryDir.FullName.Substring($SdkRepoPath.Length + 1)
            $relativePath = $relativePath -replace "\\", "/"

            $libraries += @{
                Service   = $serviceDir.Name
                Library   = $libraryDir.Name
                Path      = $relativePath
                Generator = $generator
            }
        }
    }

    return @($libraries)
}

function Invoke-SdkLibraryRegeneration {
    <#
    .SYNOPSIS
        Regenerates the specified azure-sdk-for-net libraries in parallel.

    .DESCRIPTION
        Pre-installs tsp-client and pre-builds the code generation plugin once, then invokes
        'dotnet build /t:GenerateCode' for each library concurrently. Returns one result object per
        library containing the library metadata, a Success flag, and any error output.

    .PARAMETER SdkRepoPath
        Path to the local azure-sdk-for-net repository.

    .PARAMETER Libraries
        The libraries to regenerate, as returned by Get-SdkLibrariesToRegenerate.

    .PARAMETER ThrottleLimit
        Optional. Number of concurrent regeneration jobs. Defaults to 8.

    .PARAMETER NpmRegistry
        Optional. When specified, a temporary .env file is written to the repository root so tsp-client
        restores npm packages from the given registry. The original .env is restored afterwards.

    .PARAMETER AdditionalBuildArgs
        Optional. Extra msbuild arguments appended to the 'dotnet build /t:GenerateCode' invocation.

    .PARAMETER SerialServiceDirectories
        Optional. Names of service directories whose libraries share a code generation plugin and therefore
        must be regenerated one at a time. Those libraries are regenerated serially after the parallel batch.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$SdkRepoPath,

        [Parameter(Mandatory = $true)]
        [array]$Libraries,

        [Parameter(Mandatory = $false)]
        [int]$ThrottleLimit = 0,

        [Parameter(Mandatory = $false)]
        [string]$NpmRegistry,

        [Parameter(Mandatory = $false)]
        [string[]]$AdditionalBuildArgs = @(),

        [Parameter(Mandatory = $false)]
        [string[]]$SerialServiceDirectories = @()
    )

    $ErrorActionPreference = 'Stop'

    if (-not $Libraries -or $Libraries.Count -eq 0) {
        return @()
    }

    if ($ThrottleLimit -le 0) {
        $ThrottleLimit = 8
    }
    Write-Host "Using $ThrottleLimit concurrent jobs" -ForegroundColor Gray
    Write-Host ""

    $engFolder = Join-Path $SdkRepoPath "eng"

    # Pre-install tsp-client to avoid concurrent npm operations
    Write-Host "Pre-installing tsp-client..." -ForegroundColor Gray
    $tspClientDir = Join-Path $engFolder "common" "tsp-client"
    $npmCiCommand = "npm ci --prefix $tspClientDir"
    if ($NpmRegistry) {
        $npmCiCommand += " --registry $NpmRegistry"
    }
    # Pipe to Out-Host so the command output is not captured as this function's return value
    Invoke $npmCiCommand $tspClientDir | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install tsp-client"
    }
    Write-Host "  tsp-client ready" -ForegroundColor Green
    Write-Host ""

    # Pre-build the client plugin to avoid concurrent builds
    $codeGenerationTargetPath = Join-Path $engFolder "CodeGeneration.targets"
    if (-not (Test-Path $codeGenerationTargetPath)) {
        throw "CodeGeneration.targets not found at: $codeGenerationTargetPath"
    }
    Write-Host "Pre-building client plugin..." -ForegroundColor Gray
    Invoke "dotnet build $codeGenerationTargetPath /t:BuildPlugin /p:TypeSpecInput=temp" $engFolder | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build client plugin"
    }
    Write-Host "  Client plugin ready" -ForegroundColor Green
    Write-Host ""

    # Thread-safe collections for progress tracking
    $completed = [System.Collections.Concurrent.ConcurrentBag[int]]::new()
    $totalCount = $Libraries.Count
    $buildArgs = @($AdditionalBuildArgs | Where-Object { $_ })

    $sdkEnvFile = Join-Path $SdkRepoPath ".env"
    $originalSdkEnv = $null
    $wroteSdkEnv = $false
    if ($NpmRegistry) {
        Write-Host "Configuring npm registry for tsp-client (temporary .env)..." -ForegroundColor Gray
        $originalSdkEnv = if (Test-Path $sdkEnvFile) { Get-Content $sdkEnvFile -Raw } else { $null }
        Set-Content $sdkEnvFile "npm_config_registry=$NpmRegistry`n" -Encoding utf8 -NoNewline
        $wroteSdkEnv = $true
        Write-Host "  Wrote $sdkEnvFile" -ForegroundColor Green
        Write-Host ""
    }

    # Libraries in service directories that share a code generation plugin must not be built
    # concurrently with each other, so they are regenerated in a serial batch after the parallel one.
    $parallelLibraries = @($Libraries | Where-Object { $_.Service -notin $SerialServiceDirectories })
    $serialLibraries = @($Libraries | Where-Object { $_.Service -in $SerialServiceDirectories })

    $batches = @()
    if ($parallelLibraries.Count -gt 0) {
        $batches += , @{ Libraries = $parallelLibraries; Throttle = $ThrottleLimit }
    }
    if ($serialLibraries.Count -gt 0) {
        $batches += , @{ Libraries = $serialLibraries; Throttle = 1 }
    }

    $results = @()

    try {
        foreach ($batch in $batches) {
            $batchLibraries = $batch.Libraries
            $batchThrottle = $batch.Throttle
            Write-Host "Dispatching $($batchLibraries.Count) regeneration jobs ($batchThrottle at a time)..." -ForegroundColor Cyan
            # Run regeneration in parallel
            $results += $batchLibraries | ForEach-Object -ThrottleLimit $batchThrottle -Parallel {
                $library = $_
                $azureSdkPath = $using:SdkRepoPath
                $completedBag = $using:completed
                $total = $using:totalCount
                $extraArgs = $using:buildArgs

                Write-Host "  -> Starting $($library.Library) ($($library.Service))" -ForegroundColor DarkGray

                # Determine build path (check for src subdirectory)
                $libraryPath = Join-Path $azureSdkPath $library.Path
                $srcPath = Join-Path $libraryPath "src"
                $buildPath = if ((Test-Path $srcPath) -and (Get-ChildItem -Path $srcPath -Filter "*.csproj" -ErrorAction SilentlyContinue)) {
                    $srcPath
                } else {
                    $libraryPath
                }

                # Regenerate library
                $result = try {
                    if (-not (Test-Path $libraryPath)) {
                        @{ Success = $false; Error = "Library path not found"; Output = "" }
                    } else {
                        Push-Location $buildPath
                        try {
                            $output = & dotnet build /t:GenerateCode /p:SkipTspClientInstall=true /p:SkipBuildPlugin=true @extraArgs 2>&1
                            $exitCode = $LASTEXITCODE

                            if ($exitCode -ne 0) {
                                @{ Success = $false; Error = "Generation failed with exit code $exitCode"; Output = ($output -join "`n") }
                            } else {
                                @{ Success = $true; Output = ($output -join "`n") }
                            }
                        }
                        finally {
                            Pop-Location
                        }
                    }
                }
                catch {
                    @{ Success = $false; Error = $_.Exception.Message; Output = $_.Exception.ToString() }
                }

                # Update progress counter
                $completedBag.Add(1)
                $currentCount = $completedBag.Count

                # Thread-safe console output with progress
                $status = if ($result.Success) { "✓" } else { "✗" }
                $color = if ($result.Success) { "Green" } else { "White" }

                $progressMsg = "[$currentCount/$total] $status $($library.Library)"
                Write-Host $progressMsg -ForegroundColor $color

                # Return result with library metadata
                return @{
                    Service   = $library.Service
                    Library   = $library.Library
                    Path      = $library.Path
                    Generator = $library.Generator
                    Success   = if ($result.ContainsKey('Success')) { $result.Success } else { $false }
                    Error     = if ($result.ContainsKey('Error')) { $result.Error } else { "" }
                    Output    = if ($result.ContainsKey('Output')) { $result.Output } else { "" }
                }
            }
        }
    }
    finally {
        # Remove/restore the temporary .env used to redirect tsp-client's npm registry
        if ($wroteSdkEnv) {
            if ($null -eq $originalSdkEnv) {
                Remove-Item $sdkEnvFile -Force -ErrorAction SilentlyContinue
            } else {
                Set-Content $sdkEnvFile $originalSdkEnv -Encoding utf8 -NoNewline
            }
        }
    }

    return @($results)
}

function Write-RegenerationReport {
    <#
    .SYNOPSIS
        Writes a summary of the regeneration results to the console and optionally to a JSON file.

    .PARAMETER Results
        The result objects returned by Invoke-SdkLibraryRegeneration.

    .PARAMETER ElapsedTime
        Optional. The total time taken to produce the results.

    .PARAMETER ReportPath
        Optional. When specified, the detailed results are also written as JSON to this path.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [array]$Results,

        [Parameter(Mandatory = $false)]
        [TimeSpan]$ElapsedTime,

        [Parameter(Mandatory = $false)]
        [string]$ReportPath
    )

    $passed = @($Results | Where-Object { $_.Success -eq $true })
    $failed = @($Results | Where-Object { $_.Success -eq $false })

    Write-Host "`n==================== REGENERATION REPORT ====================" -ForegroundColor Cyan
    Write-Host "Total Libraries: $($Results.Count)" -ForegroundColor White
    Write-Host "Passed: $($passed.Count)" -ForegroundColor Green
    Write-Host "Failed: $($failed.Count)" -ForegroundColor Red

    if ($ElapsedTime) {
        $elapsedFormatted = "{0:hh\:mm\:ss}" -f $ElapsedTime
        Write-Host "Execution Time: $elapsedFormatted" -ForegroundColor Cyan
    }
    Write-Host ""

    if ($passed.Count -gt 0) {
        Write-Host "PASSED LIBRARIES:" -ForegroundColor Green
        foreach ($result in $passed) {
            Write-Host "  ✓ $($result.Library) ($($result.Service))" -ForegroundColor Green
        }
        Write-Host ""
    }

    if ($failed.Count -gt 0) {
        Write-Host "FAILED LIBRARIES:" -ForegroundColor Red
        foreach ($result in $failed) {
            Write-Host "  ✗ $($result.Library) ($($result.Service))" -ForegroundColor Red
            Write-Host "    Error: $($result.Error)" -ForegroundColor Gray
            if ($result.Output) {
                Write-Host "    Details: $($result.Output.Substring(0, [Math]::Min(200, $result.Output.Length)))..." -ForegroundColor DarkGray
            }
        }
        Write-Host ""
    }

    Write-Host "=============================================================" -ForegroundColor Cyan

    # Save detailed report
    if ($ReportPath) {
        $Results | ConvertTo-Json -Depth 10 | Set-Content $ReportPath -Encoding utf8
        Write-Host "Detailed report saved to: $ReportPath" -ForegroundColor Gray
    }
}

Export-ModuleMember -Function "Update-MgmtGenerator", "Update-AzureGenerator", "Filter-LibrariesByGenerator", "Filter-LibrariesByName", "Update-OpenAIGenerator", "Add-LocalNuGetSource", "Update-AzureSpectorScenarios", "Get-SdkLibrariesToRegenerate", "Invoke-SdkLibraryRegeneration", "Write-RegenerationReport"
