#!/usr/bin/env pwsh

<#
.DESCRIPTION
Creates a pull request in the Azure SDK for .NET repository to update the UnbrandedGeneratorVersion property in eng/Packages.Data.props and the @typespec/http-client-csharp dependency in eng/packages/http-client-csharp/package.json.
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
.PARAMETER RegenerateAllLibraries
When specified, also builds the Azure and management plane emitters locally and regenerates all Azure SDK libraries (not just unbranded ones).
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
  [switch]$RegenerateAllLibraries
)

# Import the Generation module to use the Invoke helper function
Import-Module (Join-Path $PSScriptRoot "Generation.psm1") -DisableNameChecking -Force
# Import RegenPreview module for Update-AzureGenerator and Update-MgmtGenerator
Import-Module (Join-Path $PSScriptRoot "RegenPreview.psm1") -DisableNameChecking -Force

# Set up variables for the PR
$RepoOwner = "Azure"
$RepoName = "azure-sdk-for-net"
$BaseBranch = "main"
$PRBranch = $BranchName

$PRTitle = "Update UnbrandedGeneratorVersion to $PackageVersion"
if ($RegenerateAllLibraries) {
    $PRTitle = "Update GeneratorVersion to $PackageVersion (all libraries)"
}
if ($Internal) {
    $PRTitle = "[DO NOT MERGE] $PRTitle"
}
$PRBody = @"
This PR updates the UnbrandedGeneratorVersion property in eng/Packages.Data.props and the @typespec/http-client-csharp dependency in eng/packages/http-client-csharp/package.json to version $PackageVersion.

## Details

- TypeSpec commit that triggered this PR: $TypeSpecCommitUrl

## Changes

- Updated eng/Packages.Data.props UnbrandedGeneratorVersion property
- Updated eng/packages/http-client-csharp/package.json dependency version
- Ran npm install to update package-lock.json
- Ran eng/packages/http-client-csharp/eng/scripts/Generate.ps1 to regenerate test projects
- Generated emitter-package.json artifacts using tsp-client
- Regenerated SDK libraries using the unbranded emitter via dotnet msbuild /t:GenerateCode
$(if ($RegenerateAllLibraries) {
@"

### Additional changes (all-library regeneration)
- Built and packaged Azure emitter locally from eng/packages/http-client-csharp
- Built and packaged management plane emitter locally from eng/packages/http-client-csharp-mgmt
- Updated Azure and mgmt emitter package artifacts in eng/
- Regenerated SDK libraries using Azure and mgmt emitters via dotnet msbuild /t:GenerateCode
"@
})

This is an automated PR created by the TypeSpec publish pipeline.
"@

Write-Host "Creating PR in $RepoOwner/$RepoName"
Write-Host "Branch: $PRBranch"
Write-Host "Title: $PRTitle"

# Create temp folder for repo
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "azure-sdk-for-net-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "Created temp directory: $tempDir"

try {
    # Use sparse checkout to clone only the necessary files
    # This significantly reduces disk space usage as azure-sdk-for-net is a very large repository
    Write-Host "Setting up sparse checkout for azure-sdk-for-net repository..."
    
    # Initialize empty git repository
    git init $tempDir
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to initialize repository"
    }
    
    Push-Location $tempDir
    
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
    git sparse-checkout set eng sdk/core/Azure.Core/src/Shared sdk/core/Azure.Core.TestFramework/src
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

    # Update the dependency in eng/Packages.Data.props
    Write-Host "Updating dependency version in eng/Packages.Data.props..."
    $propsFilePath = Join-Path $tempDir "eng/Packages.Data.props"
    
    if (-not (Test-Path $propsFilePath)) {
        throw "eng/Packages.Data.props not found in the repository"
    }

    $propsFileContent = Get-Content $propsFilePath -Raw
    
    # Update the UnbrandedGeneratorVersion property in the file
    $pattern = '<UnbrandedGeneratorVersion>[^<]*</UnbrandedGeneratorVersion>'
    $replacement = '<UnbrandedGeneratorVersion>' + $PackageVersion + '</UnbrandedGeneratorVersion>'
    
    $updatedContent = $propsFileContent -replace $pattern, $replacement
    
    $propsFileUpdated = $false
    if ($updatedContent -eq $propsFileContent) {
        Write-Warning "No changes were made to eng/Packages.Data.props. The UnbrandedGeneratorVersion property might not exist or have a different format."
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
    
    # Regenerate all SDK libraries that use the unbranded emitter
    if ($installSucceeded) {
        Write-Host "Expanding sparse checkout to include sdk directory for SDK regeneration..."
        git sparse-checkout add sdk
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to expand sparse checkout. Skipping SDK regeneration."
            Write-Host "##vso[task.complete result=SucceededWithIssues;]"
        } else {
            # Build the emitter patterns to match in tsp-location.yaml
            $emitterPatterns = @("eng/http-client-csharp-emitter-package.json")
            
            if ($RegenerateAllLibraries) {
                Write-Host "##[section]RegenerateAllLibraries: Building Azure and management plane emitters locally..."
                
                # Build NuGet packages for generator framework (needed by Azure generator)
                Write-Host "Building NuGet generator packages..."
                $typespecPackageRoot = Join-Path $PSScriptRoot ".." ".."
                $generatorRoot = Join-Path $typespecPackageRoot "generator"
                $nugetProjects = @(
                    (Join-Path "Microsoft.TypeSpec.Generator" "src" "Microsoft.TypeSpec.Generator.csproj"),
                    (Join-Path "Microsoft.TypeSpec.Generator.Input" "src" "Microsoft.TypeSpec.Generator.Input.csproj"),
                    (Join-Path "Microsoft.TypeSpec.Generator.ClientModel" "src" "Microsoft.TypeSpec.Generator.ClientModel.csproj")
                )
                
                $debugFolder = Join-Path $typespecPackageRoot "debug"
                if (-not (Test-Path $debugFolder)) {
                    New-Item -ItemType Directory -Path $debugFolder -Force | Out-Null
                }
                
                foreach ($project in $nugetProjects) {
                    $projectPath = Join-Path $generatorRoot $project
                    if (Test-Path $projectPath) {
                        Write-Host "Packing: $(Split-Path $projectPath -Leaf)"
                        $packCmd = "dotnet pack $projectPath /p:Version=$PackageVersion /p:PackageVersion=$PackageVersion /p:PackageOutputPath=$debugFolder --configuration Debug --no-build --nologo -v:quiet"
                        $previousErrorAction = $ErrorActionPreference
                        $ErrorActionPreference = "Continue"
                        try {
                            Invoke $packCmd $generatorRoot
                        } finally {
                            $ErrorActionPreference = $previousErrorAction
                        }
                    }
                }
                
                # Package the unbranded emitter as a local .tgz for the Azure generator to depend on
                Write-Host "Packaging local unbranded emitter..."
                $unbrandedPackageJson = Join-Path $typespecPackageRoot "package.json"
                $originalUnbrandedPackageJson = Get-Content $unbrandedPackageJson -Raw
                
                try {
                    $unbrandedPkgJson = Get-Content $unbrandedPackageJson -Raw | ConvertFrom-Json
                    $unbrandedPkgJson.version = $PackageVersion
                    $unbrandedPkgJson | ConvertTo-Json -Depth 100 | Set-Content $unbrandedPackageJson -Encoding utf8
                    
                    Push-Location $typespecPackageRoot
                    try {
                        $packOutput = & npm pack 2>&1
                        $packageLine = ($packOutput | Where-Object { $_ -match '\.tgz$' } | Select-Object -First 1).ToString().Trim()
                        if ($packageLine -match 'filename:\s*(.+\.tgz)') {
                            $packageFile = $Matches[1].Trim()
                        } else {
                            $packageFile = $packageLine
                        }
                        $unbrandedPackagePath = Join-Path $typespecPackageRoot $packageFile
                        $debugUnbrandedPath = Join-Path $debugFolder $packageFile
                        Move-Item $unbrandedPackagePath $debugUnbrandedPath -Force
                        $unbrandedPackagePath = $debugUnbrandedPath
                        Write-Host "Created local unbranded package: $unbrandedPackagePath"
                    } finally {
                        Pop-Location
                    }
                } finally {
                    Set-Content $unbrandedPackageJson $originalUnbrandedPackageJson -Encoding utf8 -NoNewline
                }
                
                # Build and package Azure generator
                $azureGeneratorPath = Join-Path $tempDir "eng" "packages" "http-client-csharp"
                $packagesDataPropsPath = Join-Path $tempDir "eng" "Packages.Data.props"
                
                Write-Host "##[section]Building Azure generator..."
                $previousErrorAction = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                try {
                    $azurePackagePath = Update-AzureGenerator `
                        -AzureGeneratorPath $azureGeneratorPath `
                        -UnbrandedPackagePath $unbrandedPackagePath `
                        -DebugFolder $debugFolder `
                        -PackagesDataPropsPath $packagesDataPropsPath `
                        -LocalVersion $PackageVersion
                    Write-Host "Azure generator built successfully"
                    
                    # Update Azure emitter package artifacts
                    Write-Host "Updating Azure emitter package artifacts..."
                    $engFolder = Join-Path $tempDir "eng"
                    $azureTempDir = Join-Path $engFolder "temp-azure-package-update"
                    New-Item -ItemType Directory -Path $azureTempDir -Force | Out-Null
                    
                    try {
                        $azureEmitterJson = Join-Path $engFolder "azure-typespec-http-client-csharp-emitter-package.json"
                        $tempPackageJson = Join-Path $azureTempDir "package.json"
                        
                        Copy-Item $azureEmitterJson $tempPackageJson -Force
                        
                        Push-Location $azureTempDir
                        try {
                            Invoke "npm install `"`"file:$azurePackagePath`"`" --package-lock-only" $azureTempDir
                            
                            Copy-Item $tempPackageJson $azureEmitterJson -Force
                            $lockFile = Join-Path $azureTempDir "package-lock.json"
                            if (Test-Path $lockFile) {
                                $azureLockJson = Join-Path $engFolder "azure-typespec-http-client-csharp-emitter-package-lock.json"
                                Copy-Item $lockFile $azureLockJson -Force
                            }
                        } finally {
                            Pop-Location
                        }
                    } finally {
                        Remove-Item $azureTempDir -Recurse -Force -ErrorAction SilentlyContinue
                    }
                    
                    $emitterPatterns += "eng/azure-typespec-http-client-csharp-emitter-package.json"
                    
                    # Add NuGet source for local packages
                    $nugetConfigPath = Join-Path $tempDir "NuGet.Config"
                    if (Test-Path $nugetConfigPath) {
                        Add-LocalNuGetSource -NuGetConfigPath $nugetConfigPath -SourcePath $debugFolder
                    }
                } catch {
                    Write-Warning "Failed to build Azure generator: $($_.Exception.Message). Continuing without Azure library regeneration."
                    Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                } finally {
                    $ErrorActionPreference = $previousErrorAction
                }
                
                # Build and package management plane generator
                $mgmtGeneratorPath = Join-Path $tempDir "eng" "packages" "http-client-csharp-mgmt"
                if (Test-Path $mgmtGeneratorPath) {
                    Write-Host "##[section]Building management plane generator..."
                    $previousErrorAction = $ErrorActionPreference
                    $ErrorActionPreference = "Continue"
                    try {
                        $engFolder = Join-Path $tempDir "eng"
                        Update-MgmtGenerator `
                            -EngFolder $engFolder `
                            -DebugFolder $debugFolder `
                            -LocalVersion $PackageVersion
                        Write-Host "Management plane generator built successfully"
                        
                        $emitterPatterns += "eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json"
                    } catch {
                        Write-Warning "Failed to build management plane generator: $($_.Exception.Message). Continuing without mgmt library regeneration."
                        Write-Host "##vso[task.complete result=SucceededWithIssues;]"
                    } finally {
                        $ErrorActionPreference = $previousErrorAction
                    }
                } else {
                    Write-Host "Management plane generator not found at $mgmtGeneratorPath, skipping..."
                }
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
                foreach ($serviceDirectory in $serviceDirectories) {
                    Write-Host "Regenerating code for service directory: $serviceDirectory"
                    $previousErrorAction = $ErrorActionPreference
                    $ErrorActionPreference = "Continue"
                    try {
                        Invoke "dotnet msbuild $serviceProj /restore /t:GenerateCode /p:ServiceDirectory=$serviceDirectory" $tempDir
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
    if ($RegenerateAllLibraries) {
        $azureEmitterFiles = @(
            "eng/azure-typespec-http-client-csharp-emitter-package.json",
            "eng/azure-typespec-http-client-csharp-emitter-package-lock.json",
            "eng/azure-typespec-http-client-csharp-mgmt-emitter-package.json",
            "eng/azure-typespec-http-client-csharp-mgmt-emitter-package-lock.json",
            "eng/Packages.Data.props",
            "NuGet.Config"
        )
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
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes"
    }

    # Build commit message based on what was updated
    $commitMessage = "Update UnbrandedGeneratorVersion to $PackageVersion"
    if ($RegenerateAllLibraries) {
        $commitMessage = "Update GeneratorVersion to $PackageVersion (all libraries)"
    }
    
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }

    # Push the branch
    Write-Host "Pushing branch to remote..."
    $remoteUrl = "https://$AuthToken@github.com/$RepoOwner/$RepoName.git"
    git push $remoteUrl $PRBranch
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push branch"
    }

    # Create PR using GitHub CLI
    Write-Host "Creating PR in $RepoOwner/$RepoName using gh CLI..."
    
    # Set the authentication token for gh CLI
    $env:GH_TOKEN = $AuthToken
    
    # Create the PR using gh CLI
    $ghArgs = @("pr", "create", "--repo", "$RepoOwner/$RepoName", "--title", $PRTitle, "--body", $PRBody, "--base", $BaseBranch, "--head", $PRBranch)
    if ($Internal) {
        $ghArgs += @("--label", "Do Not Merge")
    }
    $ghOutput = & gh @ghArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create PR using gh CLI: $ghOutput"
    }
    
    # Extract PR URL from gh output
    $prUrl = $ghOutput.Trim()
    Write-Host "Successfully created PR: $prUrl"

} catch {
    Write-Error "Error creating PR: $_"
    exit 1
} finally {
    Pop-Location
    # Clean up temp directory
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
