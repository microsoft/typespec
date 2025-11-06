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

        # Step 2: Install dependencies, clean, and build
        Push-Location $GeneratorPath
        try {
            Write-Host "Installing dependencies..." -ForegroundColor Gray
            if ($UseNpmCi) {
                $installOutput = & npm install --package-lock-only 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Host $installOutput -ForegroundColor Red
                    throw "Failed to update package-lock.json"
                }
                
                $ciOutput = & npm ci 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Host $ciOutput -ForegroundColor Red
                    throw "Failed to install dependencies"
                }
            } else {
                $installOutput = & npm install 2>&1
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
        1. Updates package.json with local unbranded and Azure generator dependencies
        2. Runs npm install
        3. Runs npm run clean to ensure a clean build
        4. Builds the management plane generator
        5. Packages the management plane generator
        6. Updates eng folder emitter package artifacts (azure-typespec-http-client-csharp-mgmt-emitter-package.json)
        7. Updates mgmt emitter package artifact's devDependency for @typespec/http-client-csharp
        
        This function is designed to be called from RegenPreview.ps1 and uses the same
        versioning scheme as the main generators. It derives all necessary paths from the
        EngFolder parameter.

    .PARAMETER EngFolder
        The eng folder path in azure-sdk-for-net. All other paths (mgmt generator, 
        package paths, Packages.Data.props) are derived from this.

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

    # Use shared helper to build and package the mgmt generator
    $mgmtPackagePath = Update-GeneratorPackage `
        -GeneratorPath $mgmtGeneratorPath `
        -Dependencies @{ '@azure-typespec/http-client-csharp' = $azurePackagePath } `
        -DevDependencies @{ '@typespec/http-client-csharp' = $unbrandedPackagePath } `
        -LocalVersion $LocalVersion `
        -DebugFolder $DebugFolder `
        -UseNpmCi $false

    # Update eng folder mgmt emitter package artifacts
    Write-Host "Updating mgmt emitter package artifacts..." -ForegroundColor Gray
    
    # First, update the mgmt emitter package artifact's devDependency for @typespec/http-client-csharp
    $mgmtEmitterJson = Join-Path $EngFolder "azure-typespec-http-client-csharp-mgmt-emitter-package.json"
    $mgmtEmitterPackageJson = Get-Content $mgmtEmitterJson -Raw | ConvertFrom-Json
    
    # Check if devDependencies exists and has @typespec/http-client-csharp
    if ($mgmtEmitterPackageJson.devDependencies -and 
        $mgmtEmitterPackageJson.devDependencies.PSObject.Properties['@typespec/http-client-csharp']) {
        # Use file path to the unbranded package, not just the version string
        $mgmtEmitterPackageJson.devDependencies.'@typespec/http-client-csharp' = "file:$unbrandedPackagePath"
        $mgmtEmitterPackageJson | ConvertTo-Json -Depth 100 | Set-Content $mgmtEmitterJson -Encoding UTF8
        Write-Host "  Updated @typespec/http-client-csharp devDependency to file:$unbrandedPackagePath" -ForegroundColor Green
    }
    
    # Now update the package-lock.json with both dependencies
    $tempDir = Join-Path $EngFolder "temp-mgmt-package-update"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
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
        5. Updates Packages.Data.props with AzureGeneratorVersion
        
        This function is designed to be called from RegenPreview.ps1.

    .PARAMETER AzureGeneratorPath
        Path to the Azure generator directory in azure-sdk-for-net.

    .PARAMETER UnbrandedPackagePath
        Path to the local unbranded TypeSpec emitter package (.tgz).

    .PARAMETER DebugFolder
        The debug folder path where packaged artifacts will be stored.

    .PARAMETER PackagesDataPropsPath
        Path to the Packages.Data.props file.

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

    # Update Packages.Data.props with Azure generator version
    Write-Host "Updating Packages.Data.props..." -ForegroundColor Gray
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
            "Microsoft.TypeSpec.Generator.ClientModel"
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

        # Delete package-lock.json to force regeneration with new dependencies
        $packageLockPath = Join-Path $OpenAIRepoPath "codegen" "package-lock.json"
        if (Test-Path $packageLockPath) {
            Write-Host "Deleting codegen/package-lock.json..." -ForegroundColor Gray
            Remove-Item $packageLockPath -Force
        }

        # Run npm install to regenerate package-lock.json with local dependencies
        Write-Host "Installing dependencies in codegen directory..." -ForegroundColor Gray
        Push-Location (Join-Path $OpenAIRepoPath "codegen")
        try {
            $npmOutput = Invoke "npm install" (Join-Path $OpenAIRepoPath "codegen")
            if ($LASTEXITCODE -ne 0) {
                Write-Host $npmOutput -ForegroundColor Red
                throw "npm install failed in codegen directory"
            }
            Write-Host "  Dependencies installed" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }

        # Update OpenAI.Library.Plugin.csproj
        $pluginCsprojPath = Join-Path $OpenAIRepoPath "codegen" "generator" "src" "OpenAI.Library.Plugin.csproj"
        if (-not (Test-Path $pluginCsprojPath)) {
            throw "OpenAI.Library.Plugin.csproj not found: $pluginCsprojPath"
        }

        Write-Host "Updating OpenAI.Library.Plugin.csproj..." -ForegroundColor Gray
        [xml]$csproj = Get-Content $pluginCsprojPath
        
        $packageReference = $csproj.Project.ItemGroup.PackageReference | 
            Where-Object { $_.Include -eq "Microsoft.TypeSpec.Generator.ClientModel" } | 
            Select-Object -First 1
        
        if ($packageReference) {
            $packageReference.Version = $LocalVersion
            $csproj.Save($pluginCsprojPath)
            Write-Host "  Updated Microsoft.TypeSpec.Generator.ClientModel to $LocalVersion" -ForegroundColor Green
        } else {
            throw "Microsoft.TypeSpec.Generator.ClientModel package reference not found in csproj"
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
                "codegen/generator/src/OpenAI.Library.Plugin.csproj"
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

Export-ModuleMember -Function "Update-MgmtGenerator", "Update-AzureGenerator", "Filter-LibrariesByGenerator", "Update-OpenAIGenerator", "Add-LocalNuGetSource"
