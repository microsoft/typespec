#!/usr/bin/env pwsh -c

<#
.DESCRIPTION
Creates a pull request in the Azure SDK for .NET repository to update the UnbrandedGeneratorVersion property in eng/Packages.Data.props and the @typespec/http-client-csharp dependency in eng/packages/http-client-csharp/package.json.
.PARAMETER PackageVersion
The version of the Microsoft.TypeSpec.Generator.ClientModel package to update to.
.PARAMETER TypeSpecPRUrl
The URL of the pull request in the TypeSpec repository that triggered this update.
.PARAMETER PackageUrl
The URL of the published NuGet package.
.PARAMETER AuthToken
A GitHub personal access token for authentication.
.PARAMETER BranchName
The name of the branch to create in the azure-sdk-for-net repository.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$PackageVersion,

  [Parameter(Mandatory = $true)]
  [string]$TypeSpecPRUrl,

  [Parameter(Mandatory = $true)]
  [string]$PackageUrl,

  [Parameter(Mandatory = $true)]
  [string]$AuthToken,

  [Parameter(Mandatory = $false)]
  [string]$BranchName = "typespec/update-http-client-$PackageVersion"
)

# Set up variables for the PR
$RepoOwner = "Azure"
$RepoName = "azure-sdk-for-net"
$BaseBranch = "main"
$PROwner = "azure-sdk"
$PRBranch = $BranchName

$PRTitle = "Update UnbrandedGeneratorVersion to $PackageVersion"
$PRBody = @"
This PR updates the UnbrandedGeneratorVersion property in eng/Packages.Data.props and the @typespec/http-client-csharp dependency in eng/packages/http-client-csharp/package.json to version $PackageVersion.

## Details

- Original TypeSpec PR: $TypeSpecPRUrl
- Package URL: $PackageUrl

## Changes

- Updated eng/Packages.Data.props UnbrandedGeneratorVersion property
- Updated eng/packages/http-client-csharp/package.json dependency version
- Ran npm install to update package-lock.json

This is an automated PR created by the TypeSpec publish pipeline.
"@

Write-Host "Creating PR in $RepoOwner/$RepoName"
Write-Host "Branch: $PRBranch"
Write-Host "Title: $PRTitle"

# Create temp folder for repo
$tempDir = Join-Path $env:TEMP "azure-sdk-for-net-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
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
    
    if ($updatedContent -eq $propsFileContent) {
        Write-Warning "No changes were made to eng/Packages.Data.props. The UnbrandedGeneratorVersion property might not exist or have a different format."
        Write-Host "Current content around UnbrandedGeneratorVersion:"
        $propsFileContent | Select-String -Pattern "UnbrandedGeneratorVersion" -Context 2, 2
    }
    
    # Write the updated file back
    Set-Content -Path $propsFilePath -Value $updatedContent -NoNewline

    # Update the dependency in eng/packages/http-client-csharp/package.json
    Write-Host "Updating dependency version in eng/packages/http-client-csharp/package.json..."
    $packageJsonPath = Join-Path $tempDir "eng/packages/http-client-csharp/package.json"
    
    if (-not (Test-Path $packageJsonPath)) {
        throw "eng/packages/http-client-csharp/package.json not found in the repository"
    }

    $packageJsonContent = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Update the Microsoft.TypeSpec.Generator.ClientModel dependency version
    $updated = $false
    if ($packageJsonContent.dependencies -and $packageJsonContent.dependencies."@typespec/http-client-csharp") {
        $packageJsonContent.dependencies."@typespec/http-client-csharp" = $PackageVersion
        $updated = $true
        Write-Host "Updated @typespec/http-client-csharp in dependencies"
    }
    
    if (-not $updated) {
        Write-Warning "No @typespec/http-client-csharp dependency found in package.json"
    } else {
        # Write the updated package.json back
        $packageJsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
        
        # Run npm install in the http-client-csharp directory
        Write-Host "Running npm install in eng/packages/http-client-csharp..."
        $httpClientDir = Join-Path $tempDir "eng/packages/http-client-csharp"
        Push-Location $httpClientDir
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
            
            # Run npm run build
            Write-Host "Running npm run build in eng/packages/http-client-csharp..."
            npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "npm run build failed"
            }
        } finally {
            Pop-Location
        }
        
        # Run Generate.ps1 from the repository root
        Write-Host "Running eng/scripts/Generate.ps1..."
        Push-Location $tempDir
        try {
            & "eng/scripts/Generate.ps1"
            if ($LASTEXITCODE -ne 0) {
                throw "Generate.ps1 failed"
            }
        } finally {
            Pop-Location
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
    git add eng/Packages.Data.props
    git add eng/packages/http-client-csharp/package.json
    git add eng/packages/http-client-csharp/package-lock.json
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes"
    }

    git commit -m "Update UnbrandedGeneratorVersion to $PackageVersion

- Updated eng/Packages.Data.props
- Updated eng/packages/http-client-csharp/package.json
- Ran npm install to update package-lock.json"
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

    # Create PR using GitHub API
    Write-Host "Creating PR in $RepoOwner/$RepoName..."
    
    $headers = @{
        "Accept" = "application/vnd.github.v3+json"
        "Authorization" = "token $AuthToken"
        "User-Agent" = "Microsoft-TypeSpec"
    }
    
    $body = @{
        title = $PRTitle
        body = $PRBody
        head = $PRBranch
        base = $BaseBranch
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/pulls" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    
    Write-Host "Successfully created PR: $($response.html_url)"
    Write-Host "##vso[task.setvariable variable=CreatedPR.Number]$($response.number)"
    Write-Host "##vso[task.setvariable variable=CreatedPR.Url]$($response.html_url)"

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