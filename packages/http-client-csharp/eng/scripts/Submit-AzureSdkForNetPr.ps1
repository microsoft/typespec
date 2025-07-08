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
  [string]$TypeSpecSourcePackageJsonPath
)

# Import the Generation module to use the Invoke helper function
Import-Module (Join-Path $PSScriptRoot "Generation.psm1") -DisableNameChecking -Force

# Set up variables for the PR
$RepoOwner = "Azure"
$RepoName = "azure-sdk-for-net"
$BaseBranch = "main"
$PRBranch = $BranchName

$PRTitle = "Update UnbrandedGeneratorVersion to $PackageVersion"
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
    # Clone the repository
    Write-Host "Cloning azure-sdk-for-net repository..."
    git clone "https://github.com/$RepoOwner/$RepoName.git" $tempDir
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to clone repository"
    }

    Push-Location $tempDir

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
    if ($packageJsonUpdated) {
        # Run npm install in the http-client-csharp directory
        Write-Host "Running npm install in eng/packages/http-client-csharp..."
        $httpClientDir = Join-Path $tempDir "eng/packages/http-client-csharp"
        Invoke "npm install" $httpClientDir
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
        
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
            & (Join-Path $tempDir "eng/packages/http-client-csharp/eng/scripts/Generate.ps1")
            if ($LASTEXITCODE -ne 0) {
                throw "Generate.ps1 failed"
            }
        }
    }
    
    # Generate emitter-package.json files using tsp-client if TypeSpec package.json is provided
    if ($TypeSpecSourcePackageJsonPath -and (Test-Path $TypeSpecSourcePackageJsonPath)) {
        Write-Host "Generating emitter-package.json files using tsp-client..."
        $emitterPackageJsonPath = Join-Path $tempDir "eng/http-client-csharp-emitter-package.json"
        $tspClientResult = & tsp-client generate-config-files --package-json "$TypeSpecSourcePackageJsonPath" --emitter-package-json-path "$emitterPackageJsonPath" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "tsp-client generate-config-files failed: $tspClientResult"
            throw "Failed to generate emitter-package.json files"
        }
        Write-Host "Successfully generated emitter-package.json files"
    } else {
        Write-Warning "TypeSpecSourcePackageJsonPath not provided or file doesn't exist. Skipping emitter-package.json generation."
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
    git add (Join-Path $tempDir "eng/packages/http-client-csharp/package-lock.json")
    git add (Join-Path $tempDir "eng/packages/http-client-csharp/generator/TestProjects/")
    git add (Join-Path $tempDir "eng/http-client-csharp-emitter-package.json")
    git add (Join-Path $tempDir "eng/http-client-csharp-emitter-package-lock.json")
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes"
    }

    # Build commit message based on what was updated
    $commitMessage = "Update UnbrandedGeneratorVersion to $PackageVersion"
    
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
    $ghOutput = gh pr create --repo "$RepoOwner/$RepoName" --title $PRTitle --body $PRBody --base $BaseBranch --head $PRBranch 2>&1
    
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
