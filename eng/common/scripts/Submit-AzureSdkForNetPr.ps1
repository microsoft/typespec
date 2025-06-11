#!/usr/bin/env pwsh -c

<#
.DESCRIPTION
Creates a pull request in the Azure SDK for .NET repository to update the Microsoft.TypeSpec.Generator.ClientModel dependency.
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

$PRTitle = "Update Microsoft.TypeSpec.Generator.ClientModel to $PackageVersion"
$PRBody = @"
This PR updates the dependency on Microsoft.TypeSpec.Generator.ClientModel to version $PackageVersion.

## Details

- Original TypeSpec PR: $TypeSpecPRUrl
- Package URL: $PackageUrl

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

    # Update the dependency in Directory.Packages.props
    Write-Host "Updating dependency version in Directory.Packages.props..."
    $propsFilePath = Join-Path $tempDir "Directory.Packages.props"
    
    if (-not (Test-Path $propsFilePath)) {
        throw "Directory.Packages.props not found in the repository"
    }

    $propsFileContent = Get-Content $propsFilePath -Raw
    
    # Update the appropriate package reference in the file
    $pattern = '<PackageVersion Include="Microsoft\.TypeSpec\.Generator\.ClientModel"[^>]*>.*?</PackageVersion>'
    $replacement = '<PackageVersion Include="Microsoft.TypeSpec.Generator.ClientModel" Version="' + $PackageVersion + '" />'
    
    $updatedContent = $propsFileContent -replace $pattern, $replacement
    
    if ($updatedContent -eq $propsFileContent) {
        Write-Warning "No changes were made to Directory.Packages.props. The package reference might not exist or have a different format."
        Write-Host "Current content around Microsoft.TypeSpec:"
        $propsFileContent | Select-String -Pattern "Microsoft\.TypeSpec" -Context 2, 2
    }
    
    # Write the updated file back
    Set-Content -Path $propsFilePath -Value $updatedContent -NoNewline
    
    # Check if there are changes to commit
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Warning "No changes detected. Skipping commit and PR creation."
        return
    }

    # Commit the changes
    Write-Host "Committing changes..."
    git add Directory.Packages.props
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes"
    }

    git commit -m "Update Microsoft.TypeSpec.Generator.ClientModel to $PackageVersion"
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