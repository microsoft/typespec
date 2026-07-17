#!/usr/bin/env pwsh

<#
.DESCRIPTION
Creates a pull request in the Azure SDK for .NET repository to update the UnbrandedGeneratorVersion property in eng/centralpackagemanagement/Directory.Generation.Packages.props and the @typespec/http-client-csharp dependency in eng/packages/http-client-csharp/package.json.
.PARAMETER PackageVersion
The version of the Microsoft.TypeSpec.Generator.ClientModel package to update to.
.PARAMETER TypeSpecPRUrl
The URL of the pull request in the TypeSpec repository that triggered this update.
.PARAMETER AuthToken
A GitHub personal access token for authentication.
.PARAMETER BranchName
The name of the branch to create in the azure-sdk-for-net repository.
.PARAMETER TypeSpecSourcePackageJsonPath
The path to the TypeSpec package.json file to use for generating emitter-package.json files.
.PARAMETER RegenerateAzureLibraries
When specified, builds the Azure emitter locally and regenerates Azure data plane SDK libraries.
.PARAMETER RegenerateMgmtLibraries
When specified, builds the management plane emitter locally and regenerates mgmt SDK libraries. Implies Azure emitter build since mgmt depends on it.
.PARAMETER BuildArtifactsPath
Path to the build artifacts directory containing the published .tgz and .nupkg files. Required when RegenerateAzureLibraries or RegenerateMgmtLibraries is specified.
.PARAMETER PipelineRunUrl
The URL of the pipeline run that triggered this PR. When provided, it is included in the PR description for traceability.
.PARAMETER Phase
Which phase of the flow to run. The publish pipeline drives these as discrete, independently-failing steps that share a single on-disk checkout:
  - Prepare:          Clone azure-sdk-for-net, update the generator version, regenerate the unbranded test projects and emitter-package.json artifacts.
  - PublishGenerators: Build the Azure (and mgmt) generator from the published unbranded generator artifact and publish it to the ADO feed, pinning the emitter artifacts to the published version.
  - Regenerate:       Regenerate the SDK libraries and open the azure-sdk-for-net PR.
Defaults to 'All', which runs every phase in a single invocation (used for local, non-pipeline runs).
.PARAMETER WorkingDirectory
The azure-sdk-for-net checkout directory shared across phases. When omitted (typically for the 'All' phase), a unique temp directory is created and cleaned up automatically.
.PARAMETER DebugFolder
The directory holding the packed generator packages and NuGet packages shared between the PublishGenerators and Regenerate phases. When omitted, a unique temp directory is derived from WorkingDirectory.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$PackageVersion,

  [Parameter(Mandatory = $true)]
  [string]$TypeSpecCommitUrl,

  [Parameter(Mandatory = $true)]
  [string]$AuthToken,

  [Parameter(Mandatory = $false)]
  [string]$BranchName = "typespec/update-http-client-$PackageVersion",

  [Parameter(Mandatory = $false)]
  [string]$TypeSpecSourcePackageJsonPath,

  [Parameter(Mandatory = $false)]
  [switch]$Internal,

  [Parameter(Mandatory = $false)]
  [switch]$RegenerateAzureLibraries,

  [Parameter(Mandatory = $false)]
  [switch]$RegenerateMgmtLibraries,

  [Parameter(Mandatory = $false)]
  [string]$BuildArtifactsPath,

  [Parameter(Mandatory = $false)]
  [string]$PipelineRunUrl,

  [Parameter(Mandatory = $false)]
  [switch]$UseTypeSpecNext,

  [Parameter(Mandatory = $false)]
  [ValidateSet('All', 'Prepare', 'PublishGenerators', 'Regenerate')]
  [string]$Phase = 'All',

  [Parameter(Mandatory = $false)]
  [string]$WorkingDirectory,

  [Parameter(Mandatory = $false)]
  [string]$DebugFolder
)

# Import the Generation module to use the Invoke helper function
Import-Module (Join-Path $PSScriptRoot "Generation.psm1") -DisableNameChecking -Force
# Import RegenPreview module for Update-AzureGenerator and Update-MgmtGenerator
Import-Module (Join-Path $PSScriptRoot "RegenPreview.psm1") -DisableNameChecking -Force

# Publishing the locally built generator packages happens by default whenever a regeneration is
# requested, so the regenerated emitter-package.json artifacts reference a published version instead
# of a host-only "file:" path. That way CI can restore the emitter dependencies in the resulting
# azure-sdk-for-net PR. Resolve the registry and authenticated .npmrc used for publishing.
$PublishRegistry = $null
$PublishNpmrcPath = $null
if ($RegenerateAzureLibraries -or $RegenerateMgmtLibraries) {
    $PublishRegistry = "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/"
    $resolvedPublishNpmrc = Join-Path $PSScriptRoot "../../.npmrc"
    if (Test-Path $resolvedPublishNpmrc) {
        $PublishNpmrcPath = (Resolve-Path $resolvedPublishNpmrc).Path
        Write-Host "Generator packages will be published to $PublishRegistry using .npmrc at $PublishNpmrcPath"
    } else {
        Write-Host "Generator packages will be published to $PublishRegistry using ambient npm configuration"
    }
}

# The publish pipeline drives this script as three discrete, independently-failing steps that share a
# single on-disk azure-sdk-for-net checkout (see publish.yml). Resolve which phases this invocation runs.
$runPrepare = $Phase -in @('All', 'Prepare')
$runPublishGenerators = $Phase -in @('All', 'PublishGenerators')
$runRegenerate = $Phase -in @('All', 'Regenerate')

# Set up variables for the PR
$RepoOwner = "Azure"
$RepoName = "azure-sdk-for-net"
$BaseBranch = "main"
$PRBranch = $BranchName

$PRTitle = "Update UnbrandedGeneratorVersion to $PackageVersion"
if ($Internal) {
    $PRTitle = "[DO NOT MERGE] Preview Generator Version $PackageVersion"
}
if ($RegenerateAzureLibraries -and $RegenerateMgmtLibraries) {
    $PRTitle += " (Azure data plane + mgmt)"
} elseif ($RegenerateAzureLibraries) {
    $PRTitle += " (Azure data plane)"
} elseif ($RegenerateMgmtLibraries) {
    $PRTitle += " (Azure mgmt)"
}
$PRBody = @"
This PR updates the UnbrandedGeneratorVersion property in eng/centralpackagemanagement/Directory.Generation.Packages.props and the @typespec/http-client-csharp dependency in eng/packages/http-client-csharp/package.json to version $PackageVersion.

## Details

- TypeSpec commit that triggered this PR: $TypeSpecCommitUrl$(if ($PipelineRunUrl) {
@"

- Pipeline run that produced this PR: $PipelineRunUrl
"@
})

## Changes

- Updated eng/centralpackagemanagement/Directory.Generation.Packages.props UnbrandedGeneratorVersion property
- Updated eng/packages/http-client-csharp/package.json dependency version
- Ran npm install to update package-lock.json
- Ran eng/packages/http-client-csharp/eng/scripts/Generate.ps1 to regenerate test projects
- Generated emitter-package.json artifacts using tsp-client
- Regenerated SDK libraries using the unbranded emitter via dotnet msbuild /t:GenerateCode
$(if ($RegenerateAzureLibraries) {
@"

### Additional changes (Azure data plane regeneration)
- Built and packaged Azure emitter locally from eng/packages/http-client-csharp
- Updated Azure emitter package artifacts in eng/
- Regenerated Azure data plane SDK libraries via dotnet msbuild /t:GenerateCode
"@
})
$(if ($RegenerateMgmtLibraries) {
@"

### Additional changes (mgmt regeneration)
- Built and packaged management plane emitter locally from eng/packages/http-client-csharp-mgmt
- Updated mgmt emitter package artifacts in eng/
- Regenerated mgmt SDK libraries via dotnet msbuild /t:GenerateCode
"@
})

This is an automated PR created by the TypeSpec publish pipeline.
"@

Write-Host "Creating PR in $RepoOwner/$RepoName"
Write-Host "Branch: $PRBranch"
Write-Host "Title: $PRTitle"

# Resolve the shared checkout directory. The publish pipeline passes an explicit, deterministic
# -WorkingDirectory so the Prepare / PublishGenerators / Regenerate steps operate on the same on-disk
# checkout. For a single 'All' invocation (e.g. local runs) fall back to a unique temp directory.
if ($WorkingDirectory) {
    $tempDir = $WorkingDirectory
} else {
    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "azure-sdk-for-net-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

# The debug folder holds the packed generator + NuGet packages shared between the PublishGenerators and
# Regenerate phases. Derive a deterministic default from the checkout so both phases agree.
if (-not $DebugFolder) {
    $DebugFolder = Join-Path $tempDir ".generator-packages"
}

if ($runPrepare) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Write-Host "Created temp directory: $tempDir"
} elseif (-not (Test-Path $tempDir)) {
    throw "Working directory '$tempDir' does not exist. The Prepare phase must run before the '$Phase' phase."
}

# Derived paths shared across phases (each phase may run in a separate process, so compute these from
# $tempDir rather than relying on state set by an earlier phase).
$propsFilePath = Join-Path $tempDir "eng/centralpackagemanagement/Directory.Generation.Packages.props"
$packageJsonPath = Join-Path $tempDir "eng/packages/http-client-csharp/package.json"
$httpClientDir = Join-Path $tempDir "eng/packages/http-client-csharp"

# Whether the unbranded npm install/build succeeded during Prepare. In a split pipeline run the
# Regenerate phase only runs when the Prepare step succeeded (the pipeline fails otherwise), so default
# to true; the 'All' path updates this in the Prepare section below. The Prepare phase persists the
# resolved value to a sibling state file so the later phase processes can honor the same gating.
$installSucceeded = $true
$prepareStateFile = "$tempDir.prepare-state.json"
if (-not $runPrepare -and (Test-Path $prepareStateFile)) {
    try {
        $installSucceeded = [bool]((Get-Content $prepareStateFile -Raw | ConvertFrom-Json).InstallSucceeded)
    } catch {
        Write-Warning "Failed to read Prepare state from ${prepareStateFile}: $($_.Exception.Message). Assuming install succeeded."
    }
}

try {
    Push-Location $tempDir

    # Set the authentication token for gh CLI early so that scripts invoked
    # during the build (e.g. Emitter_Version_Dashboard.ps1) can call the
    # GitHub API to resolve commit hashes in shallow clones.
    $env:GH_TOKEN = $AuthToken

    # Configure git user for commits in this repository
    git config user.name "azure-sdk"
    git config user.email "azuresdk@microsoft.com"

    if ($runPrepare) {
        # Use sparse checkout to clone only the necessary files
        # This significantly reduces disk space usage as azure-sdk-for-net is a very large repository
        Write-Host "Setting up sparse checkout for azure-sdk-for-net repository..."

        # Initialize empty git repository
        git init $tempDir
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to initialize repository"
        }

        # Add the remote
        git remote add origin "https://github.com/$RepoOwner/$RepoName.git"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to add remote"
        }

        # Enable sparse checkout with cone mode for better performance
        git sparse-checkout init --cone
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to initialize sparse checkout"
        }

        # Set the sparse checkout patterns - only the directories we need
        # Note: 'eng' covers eng/packages/http-client-csharp, eng/packages/http-client-csharp-mgmt, and all eng/ artifacts
        # Note: 'doc/GeneratorVersions' is needed for regenerating the emitter version dashboard
        git sparse-checkout set eng sdk/core/Azure.Core/src/Shared sdk/core/Azure.Core.TestFramework/src doc/GeneratorVersions
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to set sparse checkout patterns"
        }

        # Fetch only the main branch with depth 1
        Write-Host "Fetching $BaseBranch branch with sparse checkout..."
        git fetch --depth 1 origin $BaseBranch
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to fetch repository"
        }

        # Checkout the fetched branch
        git checkout $BaseBranch
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to checkout $BaseBranch"
        }

        # Create a new branch
        Write-Host "Creating branch $PRBranch..."
        git checkout -b $PRBranch
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create branch"
        }
    }

    if ($runPrepare) {
    # Update the dependency in eng/centralpackagemanagement/Directory.Generation.Packages.props
    Write-Host "Updating dependency version in eng/centralpackagemanagement/Directory.Generation.Packages.props..."
    $propsFilePath = Join-Path $tempDir "eng/centralpackagemanagement/Directory.Generation.Packages.props"
    
    if (-not (Test-Path $propsFilePath)) {
        throw "eng/centralpackagemanagement/Directory.Generation.Packages.props not found in the repository"
    }

    $propsFileContent = Get-Content $propsFilePath -Raw
    
    # Update the UnbrandedGeneratorVersion property in the file
    $pattern = '<UnbrandedGeneratorVersion>[^<]*</UnbrandedGeneratorVersion>'
    $replacement = '<UnbrandedGeneratorVersion>' + $PackageVersion + '</UnbrandedGeneratorVersion>'
    
    $updatedContent = $propsFileContent -replace $pattern, $replacement
    
    $propsFileUpdated = $false
    if ($updatedContent -eq $propsFileContent) {
        Write-Warning "No changes were made to eng/centralpackagemanagement/Directory.Generation.Packages.props. The UnbrandedGeneratorVersion property might not exist or have a different format."
        Write-Host "Current content around UnbrandedGeneratorVersion:"
        $propsFileContent | Select-String -Pattern "UnbrandedGeneratorVersion" -Context 2, 2
    } else {
        $propsFileUpdated = $true
        # Write the updated file back
        Set-Content -Path $propsFilePath -Value $updatedContent -NoNewline
    }

    # Update the dependency in eng/packages/http-client-csharp/package.json
    Write-Host "Updating dependency version in eng/packages/http-client-csharp/package.json..."
    $packageJsonPath = Join-Path $tempDir "eng/packages/http-client-csharp/package.json"
    
    if (-not (Test-Path $packageJsonPath)) {
        throw "eng/packages/http-client-csharp/package.json not found in the repository"
    }

    $packageJsonContent = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Update the Microsoft.TypeSpec.Generator.ClientModel dependency version
    $packageJsonUpdated = $false
    if ($packageJsonContent.dependencies -and $packageJsonContent.dependencies."@typespec/http-client-csharp") {
        $packageJsonContent.dependencies."@typespec/http-client-csharp" = $PackageVersion
        $packageJsonUpdated = $true
        Write-Host "Updated @typespec/http-client-csharp in dependencies"
        # Write the updated package.json back
        $packageJsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
    } else {
        Write-Warning "No @typespec/http-client-csharp dependency found in package.json"
    }
    
    # Check if any updates were made - bail early if not
    if (-not $propsFileUpdated -and -not $packageJsonUpdated) {
        Write-Warning "No updates were made to any files. The package version might already be current or the files might not contain the expected properties."
        return
    }
    
    # Only run expensive operations if we actually made updates
    $installSucceeded = $true
    if ($packageJsonUpdated) {
        # Run npm install in the http-client-csharp directory
        Write-Host "##[section]Running npm install in eng/packages/http-client-csharp..."
        $httpClientDir = Join-Path $tempDir "eng/packages/http-client-csharp"

        # Update TypeSpec dependencies to @next versions in the Azure emitter package.json
        if ($UseTypeSpecNext) {
            Write-Host "##[section]Updating Azure emitter TypeSpec dependencies to @next versions..."
            $azurePackageJsonPath = Join-Path $httpClientDir "package.json"
            Invoke "npx -y @azure-tools/typespec-bump-deps@latest --use-peer-ranges `"$azurePackageJsonPath`"" $httpClientDir
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "typespec-bump-deps failed with exit code $LASTEXITCODE"
            } else {
                Write-Host "Azure emitter TypeSpec dependencies updated to @next versions"
            }
        }
        
        # Copy .npmrc file from source directory if it exists (for internal builds)
        $sourceNpmrcPath = Join-Path $PSScriptRoot "../../.npmrc"
        $targetNpmrcPath = Join-Path $httpClientDir ".npmrc"
        
        if (Test-Path $sourceNpmrcPath) {
            Write-Host "Copying .npmrc from source directory to cloned repo..."
            Copy-Item -Path $sourceNpmrcPath -Destination $targetNpmrcPath -Force
            Write-Host "Successfully copied .npmrc to: $targetNpmrcPath"
        } else {
            Write-Host "No .npmrc file found in source directory - will use default npm registry"
        }
        
        # Log npm configuration before install
        Write-Host "##[group]NPM Configuration Check"
        Write-Host "Working directory: $httpClientDir"
        
        # Check for .npmrc file in the directory
        $npmrcPath = Join-Path $httpClientDir ".npmrc"
        if (Test-Path $npmrcPath) {
            Write-Host "Found .npmrc file at: $npmrcPath"
        } else {
            Write-Host "No .npmrc file found in working directory - will use default npm registry"
        }
        
        # Show what registry npm will use
        Push-Location $httpClientDir
        try {
            $currentRegistry = npm config get registry 2>&1
            Write-Host "Current npm registry: $currentRegistry"
        } finally {
            Pop-Location
        }
        Write-Host "##[endgroup]"
        
        $previousErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try {
            Write-Host "Running: npm install --verbose"
            Invoke "npm install --verbose" $httpClientDir
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "npm install failed with exit code $LASTEXITCODE, skipping generation."
                Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                $installSucceeded = $false
            } else {
                Write-Host "##[section]npm install completed successfully"
            }
        } catch {
            Write-Warning "npm install failed: $($_.Exception.Message), skipping generation."
            $installSucceeded = $false
        }
        finally {
            $ErrorActionPreference = $previousErrorAction
        }

        if (-not $installSucceeded) {
            Write-Host "Skipping build and generation steps."
        } else {
            # Only run build and generation if npm install succeeded
            # Run npm run build
            Write-Host "Running npm run build in eng/packages/http-client-csharp..."
            $shouldRunGenerate = $true
            $previousErrorAction = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            try {
                Invoke "npm run build" $httpClientDir
                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "npm run build failed with exit code $LASTEXITCODE, skipping Generate.ps1"
                    Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                    $shouldRunGenerate = $false
                }
            } catch {
                Write-Warning "npm run build failed: $($_.Exception.Message), skipping Generate.ps1"
                $shouldRunGenerate = $false
            } finally {
                $ErrorActionPreference = $previousErrorAction
            }
            
            # Run Generate.ps1 from the package root
            if ($shouldRunGenerate -eq $true)
            {
                Write-Host "Running eng/packages/http-client-csharp/eng/scripts/Generate.ps1..."
                $previousErrorAction = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                try {
                    $generationScriptPath = Join-Path $tempDir "eng/packages/http-client-csharp/eng/scripts/Generate.ps1"
                    Invoke "pwsh $generationScriptPath"
                    if ($LASTEXITCODE -ne 0) {
                        Write-Warning "Generate.ps1 failed with exit code $LASTEXITCODE. Continuing with emitter artifact updates."
                        Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                    }
                } catch {
                    Write-Warning "Generate.ps1 failed: $($_.Exception.Message). Continuing with emitter artifact updates."
                    Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                } finally {
                    $ErrorActionPreference = $previousErrorAction
                }
            }
        }
    }
    
    # Generate emitter-package.json files using tsp-client if TypeSpec package.json is provided
    if ($TypeSpecSourcePackageJsonPath -and (Test-Path $TypeSpecSourcePackageJsonPath)) {
        Write-Host "##[section]Generating emitter-package.json files using tsp-client..."
        
        Write-Host "Source package.json: $TypeSpecSourcePackageJsonPath"
        Write-Host "Package version being installed: $PackageVersion"
        
        $configFilesOutputDir = Join-Path $tempDir "eng"
        $emitterPackageJsonPath = Join-Path $configFilesOutputDir "http-client-csharp-emitter-package.json"
        
        # Set NPM_CONFIG_USERCONFIG to point to our .npmrc so tsp-client's internal npm install
        # can resolve packages from Azure Artifacts. tsp-client creates a temp directory for
        # npm install, so a project-level .npmrc in the eng directory won't be found.
        $sourceNpmrcPath = Join-Path $PSScriptRoot "../../.npmrc"
        $previousNpmConfigUserconfig = $env:NPM_CONFIG_USERCONFIG
        
        if (Test-Path $sourceNpmrcPath) {
            $resolvedNpmrcPath = (Resolve-Path $sourceNpmrcPath).Path
            Write-Host "Setting NPM_CONFIG_USERCONFIG to use .npmrc for tsp-client package resolution..."
            Write-Host "  Source .npmrc: $resolvedNpmrcPath"
            $env:NPM_CONFIG_USERCONFIG = $resolvedNpmrcPath
            
            Write-Host "npm registry for tsp-client:"
            npm config get registry
        } else {
            Write-Host "No .npmrc file found - tsp-client will use default npm registry"
        }

        # Align any leftover @typespec/openapi3 in the target emitter-package.json with
        # the source emitter's @typespec/openapi version. tsp-client generate-config-files
        # preserves unknown devDependencies, so a stale @typespec/openapi3 (peerOptional
        # @typespec/streams ^X.Y.0) breaks the internal npm install with ERESOLVE once
        # the source bumps the typespec family.
        if (Test-Path $emitterPackageJsonPath) {
            try {
                $target = Get-Content $emitterPackageJsonPath -Raw | ConvertFrom-Json -AsHashtable
                $source = Get-Content $TypeSpecSourcePackageJsonPath -Raw | ConvertFrom-Json -AsHashtable
                $newVersion = $source.devDependencies.'@typespec/openapi'
                $oldVersion = $target.devDependencies.'@typespec/openapi3'
                if ($newVersion -and $oldVersion -and $oldVersion -ne $newVersion) {
                    Write-Host "Patching @typespec/openapi3 in target emitter-package.json: $oldVersion -> $newVersion"
                    $target.devDependencies.'@typespec/openapi3' = $newVersion
                    ($target | ConvertTo-Json -Depth 100) | Set-Content -Path $emitterPackageJsonPath -NoNewline
                }
            } catch {
                Write-Warning "Failed to patch @typespec/openapi3 in target emitter-package.json: $_"
            }
        }

        try {
            Invoke "tsp-client generate-config-files --package-json $TypeSpecSourcePackageJsonPath --emitter-package-json-path $emitterPackageJsonPath --output-dir $configFilesOutputDir" $tempDir
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to generate emitter-package.json files"
            }
            Write-Host "Successfully generated emitter-package.json files"
        } finally {
            # Restore previous NPM_CONFIG_USERCONFIG
            $env:NPM_CONFIG_USERCONFIG = $previousNpmConfigUserconfig
        }
    } else {
        Write-Warning "TypeSpecSourcePackageJsonPath not provided or file doesn't exist. Skipping emitter-package.json generation."
    }

    # Persist the resolved install state so the later PublishGenerators / Regenerate phases (which may
    # run as separate processes) honor the same gating as a single 'All' invocation.
    @{ InstallSucceeded = $installSucceeded } | ConvertTo-Json | Set-Content $prepareStateFile -Encoding utf8
    } # end if ($runPrepare)

    # PublishGenerators phase: build the Azure (and mgmt) generator from the published unbranded
    # generator artifact and publish it to the ADO feed, pinning the emitter artifacts to the published
    # version. This runs as a discrete, fail-hard pipeline step (see publish.yml) so any build/publish
    # failure fails the pipeline instead of silently producing an unrestorable PR.
    if ($runPublishGenerators -and $installSucceeded -and ($RegenerateAzureLibraries -or $RegenerateMgmtLibraries)) {
        $regenScope = @()
        if ($RegenerateAzureLibraries) { $regenScope += "Azure data plane" }
        if ($RegenerateMgmtLibraries) { $regenScope += "mgmt" }
        Write-Host "##[section]Building and publishing generators for: $($regenScope -join ', ')..."

        # Locate the unbranded .tgz and .nupkg files from build artifacts
        if (-not $BuildArtifactsPath -or -not (Test-Path $BuildArtifactsPath)) {
            throw "BuildArtifactsPath is required when RegenerateAzureLibraries or RegenerateMgmtLibraries is specified. Path: $BuildArtifactsPath"
        }

        New-Item -ItemType Directory -Path $DebugFolder -Force | Out-Null

        # Find unbranded .tgz from build artifacts
        $unbrandedTgz = Get-ChildItem -Path $BuildArtifactsPath -Filter "typespec-http-client-csharp-*.tgz" -Recurse | Select-Object -First 1
        if (-not $unbrandedTgz) {
            throw "Could not find unbranded emitter .tgz in build artifacts at: $BuildArtifactsPath"
        }
        $unbrandedPackagePath = $unbrandedTgz.FullName
        Write-Host "Using unbranded package from build artifacts: $unbrandedPackagePath"

        # Copy .nupkg files from build artifacts to debug folder
        $nupkgFiles = Get-ChildItem -Path $BuildArtifactsPath -Filter "*.nupkg" -Recurse
        foreach ($nupkg in $nupkgFiles) {
            Copy-Item $nupkg.FullName -Destination $DebugFolder -Force
            Write-Host "Copied NuGet package: $($nupkg.Name)"
        }

        # Build and package Azure generator (needed for both Azure data plane and mgmt)
        $azureGeneratorPath = Join-Path $tempDir "eng" "packages" "http-client-csharp"
        $packagesDataPropsPath = Join-Path $tempDir "eng" "centralpackagemanagement" "Directory.Generation.Packages.props"
        $engFolder = Join-Path $tempDir "eng"

        Write-Host "##[section]Building Azure generator..."
        # When publishing, query the ADO feed for the next available version to stamp the Azure
        # emitter package with, following the existing "<base>-alpha.<yyyyMMdd>.<n>" format.
        $azurePublishVersion = $null
        if ($PublishRegistry) {
            $azureBaseVersion = ((Get-Content (Join-Path $azureGeneratorPath "package.json") -Raw | ConvertFrom-Json).version -split '-')[0]
            $azurePublishVersion = Get-NextGeneratorVersion `
                -PackageName '@azure-typespec/http-client-csharp' `
                -BaseVersion $azureBaseVersion `
                -Registry $PublishRegistry `
                -NpmrcPath $PublishNpmrcPath
        }
        $azurePackagePath = Update-AzureGenerator `
            -AzureGeneratorPath $azureGeneratorPath `
            -UnbrandedPackagePath $unbrandedPackagePath `
            -DebugFolder $DebugFolder `
            -PackagesDataPropsPath $packagesDataPropsPath `
            -LocalVersion $PackageVersion `
            -PublishRegistry $PublishRegistry `
            -PublishVersion $azurePublishVersion `
            -NpmrcPath $PublishNpmrcPath
        Write-Host "Azure generator built successfully"

        # Update Azure emitter package artifacts. When publishing, reference the published
        # version so CI can restore it; otherwise pin to the local tgz via a "file:" path.
        Write-Host "Updating Azure emitter package artifacts..."
        $azureEmitterJson = Join-Path $engFolder "azure-typespec-http-client-csharp-emitter-package.json"
        $azureLockJson = Join-Path $engFolder "azure-typespec-http-client-csharp-emitter-package-lock.json"

        $updateAzureEmitterArgs = @{
            EmitterJsonPath = $azureEmitterJson
            LockJsonPath    = $azureLockJson
            PackagePath     = $azurePackagePath
        }
        if ($PublishRegistry) {
            $updateAzureEmitterArgs.PackageName = '@azure-typespec/http-client-csharp'
            $updateAzureEmitterArgs.PublishVersion = $azurePublishVersion
            $updateAzureEmitterArgs.Registry = $PublishRegistry
        }
        Update-EmitterPackageArtifact @updateAzureEmitterArgs

        # Add NuGet source for local packages
        $nugetConfigPath = Join-Path $tempDir "NuGet.Config"
        if (Test-Path $nugetConfigPath) {
            Add-LocalNuGetSource -NuGetConfigPath $nugetConfigPath -SourcePath $DebugFolder
        }

        # Build and package management plane generator (only when mgmt is requested)
        if ($RegenerateMgmtLibraries) {
            $mgmtGeneratorPath = Join-Path $tempDir "eng" "packages" "http-client-csharp-mgmt"
            if (-not (Test-Path $mgmtGeneratorPath)) {
                throw "Management plane generator not found at $mgmtGeneratorPath"
            }
            Write-Host "##[section]Building management plane generator..."
            # When publishing, query the ADO feed for the next available mgmt emitter version.
            $mgmtPublishVersion = $null
            if ($PublishRegistry) {
                $mgmtBaseVersion = ((Get-Content (Join-Path $mgmtGeneratorPath "package.json") -Raw | ConvertFrom-Json).version -split '-')[0]
                $mgmtPublishVersion = Get-NextGeneratorVersion `
                    -PackageName '@azure-typespec/http-client-csharp-mgmt' `
                    -BaseVersion $mgmtBaseVersion `
                    -Registry $PublishRegistry `
                    -NpmrcPath $PublishNpmrcPath
            }
            Update-MgmtGenerator `
                -EngFolder $engFolder `
                -DebugFolder $DebugFolder `
                -LocalVersion $PackageVersion `
                -PublishRegistry $PublishRegistry `
                -PublishVersion $mgmtPublishVersion `
                -AzureVersion $azurePublishVersion `
                -UnbrandedVersion $PackageVersion `
                -NpmrcPath $PublishNpmrcPath
            Write-Host "Management plane generator built successfully"
        }
    }

    # Regenerate phase: regenerate all SDK libraries that consume the (now published) emitters.
    if ($runRegenerate -and $installSucceeded) {
        Write-Host "Expanding sparse checkout to include sdk directory for SDK regeneration..."
        git sparse-checkout add sdk
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to expand sparse checkout. Skipping SDK regeneration."
            Write-Host "##vso[task.complete result=SucceededWithIssues;]"
        } else {
            # Build the emitter patterns to match in tsp-location.yaml. The Azure/mgmt emitter
            # artifacts are produced by the PublishGenerators phase and persisted on disk.
            $emitterPatterns = @("eng/http-client-csharp-emitter-package.json")
            if ($RegenerateAzureLibraries) {
                $emitterPatterns += "eng/azure-typespec-http-client-csharp-emitter-package.json"
            }
            if ($RegenerateMgmtLibraries) {
                $emitterPatterns += "eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json"
            }

            # Discover service directories with tsp-location.yaml referencing any of the matched emitter patterns
            $tspLocations = Get-ChildItem -Path (Join-Path $tempDir "sdk") -Filter "tsp-location.yaml" -Recurse
            $serviceDirectories = @()
            foreach ($tspLocation in $tspLocations) {
                $content = Get-Content $tspLocation.FullName -Raw
                $matched = $false
                foreach ($pattern in $emitterPatterns) {
                    if ($content -match [regex]::Escape($pattern)) {
                        $matched = $true
                        break
                    }
                }
                if ($matched) {
                    $relativePath = $tspLocation.DirectoryName -replace ".*[\\/]sdk[\\/]", ""
                    $serviceDirectory = $relativePath -replace "[\\/].*", ""
                    if ($serviceDirectories -notcontains $serviceDirectory) {
                        $serviceDirectories += $serviceDirectory
                    }
                }
            }

            if ($serviceDirectories.Count -eq 0) {
                Write-Host "No SDK libraries found matching emitter patterns. Skipping SDK regeneration."
            } else {
                $serviceProj = Join-Path $tempDir "eng/service.proj"

                # Service directories whose libraries share a single code generator plugin that each
                # library's generation builds into a common output folder. These services are regenerated
                # serially since they share a common plugin project that shouldn't be built in parallel.
                $serialCodeGenServiceDirectories = @("ai")

                foreach ($serviceDirectory in $serviceDirectories) {
                    Write-Host "Regenerating code for service directory: $serviceDirectory"
                    $previousErrorAction = $ErrorActionPreference
                    $ErrorActionPreference = "Continue"
                    try {
                        $generateCommand = "dotnet msbuild $serviceProj /restore /t:GenerateCode /p:Trace=true /p:ServiceDirectory=$serviceDirectory"
                        if ($serialCodeGenServiceDirectories -contains $serviceDirectory) {
                            $generateCommand += " /m:1 /p:BuildInParallel=false"
                        }
                        Invoke $generateCommand $tempDir
                        if ($LASTEXITCODE -ne 0) {
                            Write-Warning "Code generation failed for $serviceDirectory with exit code $LASTEXITCODE. Continuing with next service directory."
                            Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                        }
                    } catch {
                        Write-Warning "Code generation failed for $serviceDirectory`: $($_.Exception.Message). Continuing with next service directory."
                        Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                    } finally {
                        $ErrorActionPreference = $previousErrorAction
                    }
                }
            }
        }
    }

    # Regenerate the emitter version dashboard
    if ($runRegenerate) {
    Write-Host "Regenerating emitter version dashboard..."
    $dashboardScript = Join-Path $tempDir "doc/GeneratorVersions/Emitter_Version_Dashboard.ps1"
    & $dashboardScript -RepoRoot $tempDir

    # Check if there are changes to commit
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Warning "No changes detected. Skipping commit and PR creation."
        return
    }

    # Commit the changes
    Write-Host "Committing changes..."
    git add $propsFilePath
    git add (Join-Path $tempDir "eng/packages/http-client-csharp/package.json")
    
    # Only add these files if npm install succeeded
    if ($installSucceeded) {
        $packageLockPath = Join-Path $tempDir "eng/packages/http-client-csharp/package-lock.json"
        if (Test-Path $packageLockPath) {
            git add $packageLockPath
        }
        
        $testProjectsPath = Join-Path $tempDir "eng/packages/http-client-csharp/generator/TestProjects/"
        if (Test-Path $testProjectsPath) {
            git add $testProjectsPath
        }
    }
    
    # Only add emitter files if they were generated
    $emitterPackageJsonPath = Join-Path $tempDir "eng/http-client-csharp-emitter-package.json"
    if (Test-Path $emitterPackageJsonPath) {
        git add $emitterPackageJsonPath
    }
    
    $emitterPackageLockPath = Join-Path $tempDir "eng/http-client-csharp-emitter-package-lock.json"
    if (Test-Path $emitterPackageLockPath) {
        git add $emitterPackageLockPath
    }
    
    # Add Azure and mgmt emitter artifacts if they were updated
    if ($RegenerateAzureLibraries -or $RegenerateMgmtLibraries) {
        $azureEmitterFiles = @(
            "eng/azure-typespec-http-client-csharp-emitter-package.json",
            "eng/azure-typespec-http-client-csharp-emitter-package-lock.json",
            "eng/centralpackagemanagement/Directory.Generation.Packages.props",
            "NuGet.Config"
        )
        if ($RegenerateMgmtLibraries) {
            $azureEmitterFiles += @(
                "eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json",
                "eng/azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json"
            )
        }
        foreach ($file in $azureEmitterFiles) {
            $filePath = Join-Path $tempDir $file
            if (Test-Path $filePath) {
                git add $filePath
            }
        }
    }
    
    # Add any SDK regeneration changes
    $sdkPath = Join-Path $tempDir "sdk"
    if (Test-Path $sdkPath) {
        git add $sdkPath
    }

    # Add the regenerated dashboard
    $dashboardPath = Join-Path $tempDir "doc/GeneratorVersions/Emitter_Version_Dashboard.md"
    if (Test-Path $dashboardPath) {
        git add $dashboardPath
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes"
    }

    # Build commit message based on what was updated
    $commitMessage = "Update UnbrandedGeneratorVersion to $PackageVersion"
    if ($RegenerateAzureLibraries -and $RegenerateMgmtLibraries) {
        $commitMessage = "Update GeneratorVersion to $PackageVersion (all libraries)"
    } elseif ($RegenerateAzureLibraries) {
        $commitMessage = "Update GeneratorVersion to $PackageVersion (Azure data plane)"
    } elseif ($RegenerateMgmtLibraries) {
        $commitMessage = "Update GeneratorVersion to $PackageVersion (Azure mgmt)"
    }
    
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }

    $loginScript = Join-Path $PSScriptRoot "../../../../eng/common/scripts/login-to-github.ps1"
    if (Test-Path $loginScript) {
        Write-Host "Refreshing GitHub App installation token before push..."
        try {
            & $loginScript -InstallationTokenOwners 'Azure' -VariableNamePrefix 'GH_TOKEN'
            if ($LASTEXITCODE -eq 0 -and (Test-Path Env:GH_TOKEN)) {
                $AuthToken = $env:GH_TOKEN
                Write-Host "GitHub App installation token refreshed."
            } else {
                Write-Warning "login-to-github.ps1 did not produce a fresh token (exit code $LASTEXITCODE); falling back to existing token."
            }
        } catch {
            Write-Warning "Failed to refresh GitHub App installation token: $($_.Exception.Message). Falling back to existing token."
        }
    } else {
        Write-Host "login-to-github.ps1 not found at $loginScript; skipping token refresh (assuming a non-pipeline run with a long-lived token)."
    }

    # Push the branch. Use the x-access-token username scheme so the URL works
    # both with classic PATs and with GitHub App installation tokens (ghs_*).
    Write-Host "Pushing branch to remote..."
    $remoteUrl = "https://x-access-token:$AuthToken@github.com/$RepoOwner/$RepoName.git"
    git push $remoteUrl $PRBranch
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push branch"
    }

    # Create PR using GitHub CLI
    Write-Host "Creating PR in $RepoOwner/$RepoName using gh CLI..."
    
    # Create the PR using gh CLI
    $ghArgs = @("pr", "create", "--repo", "$RepoOwner/$RepoName", "--title", $PRTitle, "--body", $PRBody, "--base", $BaseBranch, "--head", $PRBranch)
    if ($Internal -or $UseTypeSpecNext) {
        $ghArgs += @("--label", "Do Not Merge")
    }
    $ghOutput = & gh @ghArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create PR using gh CLI: $ghOutput"
    }
    
    # Extract PR URL from gh output
    $prUrl = $ghOutput.Trim()
    Write-Host "Successfully created PR: $prUrl"
    } # end if ($runRegenerate)

} catch {
    Write-Error "Error creating PR: $_"
    exit 1
} finally {
    Pop-Location
    # Clean up the shared checkout only when this invocation owns its whole lifecycle. In a split
    # pipeline run the Regenerate phase is the last step, so it performs the cleanup; earlier phases
    # (Prepare/PublishGenerators) leave the checkout in place for the next step.
    if ($Phase -in @('All', 'Regenerate') -and (Test-Path $tempDir)) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $prepareStateFile -Force -ErrorAction SilentlyContinue
    }
}
