#!/usr/bin/env pwsh

<#
.DESCRIPTION
Creates a draft pull request in the Azure SDK for .NET repository to preview the impact of regenerating libraries with a prerelease version of http-client-csharp.
.PARAMETER PackageVersion
The prerelease version of the Microsoft.TypeSpec.Generator packages to use.
.PARAMETER TypeSpecCommitUrl
The URL of the TypeSpec commit that triggered this preview.
.PARAMETER AuthToken
A GitHub personal access token for authentication.
.PARAMETER AzureSdkRepoPath
The path to the local azure-sdk-for-net repository clone.
.PARAMETER RegenSuccess
Boolean indicating whether the regeneration was successful.
.PARAMETER BranchName
The name of the branch to create in the azure-sdk-for-net repository.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$PackageVersion,

  [Parameter(Mandatory = $true)]
  [string]$TypeSpecCommitUrl,

  [Parameter(Mandatory = $true)]
  [string]$AuthToken,

  [Parameter(Mandatory = $true)]
  [string]$AzureSdkRepoPath,

  [Parameter(Mandatory = $true)]
  [bool]$RegenSuccess,

  [Parameter(Mandatory = $false)]
  [string]$BranchName = "regen-preview/http-client-csharp-$PackageVersion",

  [Parameter(Mandatory = $false)]
  [string]$BuildUri = "",

  [Parameter(Mandatory = $false)]
  [string]$LibraryType = "All"
)

# Import the Generation module to use the Invoke helper function
Import-Module (Join-Path $PSScriptRoot "Generation.psm1") -DisableNameChecking -Force

# Set up variables for the PR
$RepoOwner = "Azure"
$RepoName = "azure-sdk-for-net"
$BaseBranch = "main"
$PRBranch = $BranchName

# Determine PR title based on success/failure
$titlePrefix = if ($RegenSuccess) { "" } else { "(Failed) " }
$PRTitle = "$titlePrefix Regen Preview: Update generator version to prerelease $PackageVersion"

# Create PR body with dynamic package names based on library type
$statusEmoji = if ($RegenSuccess) { '✅ Success' } else { '❌ Failed' }

# Determine which packages were regenerated
$packageNames = switch ($LibraryType) {
    "Azure" { "@azure-typespec/http-client-csharp" }
    "Unbranded" { "@typespec/http-client-csharp" }
    "Mgmt" { "@azure-typespec/http-client-csharp-mgmt" }
    default { "@typespec/http-client-csharp, @azure-typespec/http-client-csharp, @azure-typespec/http-client-csharp-mgmt" }
}

$PRBody = @"
This is an automated preview PR to show the impact of regenerating libraries with the prerelease version $PackageVersion of $packageNames.

## Details

- TypeSpec commit: $TypeSpecCommitUrl
- Regeneration status: $statusEmoji
"@

if ($BuildUri) {
    $PRBody += @"

- Build: $BuildUri
"@
}

$PRBody += @"


## Purpose

This PR is for reviewing the code generation changes only. Review the diff to understand the impact of the TypeSpec changes.
"@

Write-Host "Creating draft PR in $RepoOwner/$RepoName"
Write-Host "Branch: $PRBranch"
Write-Host "Title: $PRTitle"

Push-Location $AzureSdkRepoPath
try {
    # Create and checkout new branch
    git checkout -b $PRBranch
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create branch"
    }

    # Stage only changes in sdk folder
    git add sdk/
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to stage changes"
    }

    # Check if there are changes to commit
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No changes to commit, skipping PR creation"
        return
    }

    # Commit changes
    git commit -m $PRTitle
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }

    # Push branch with authentication
    Write-Host "Pushing branch to remote..."
    $remoteUrl = "https://$AuthToken@github.com/$RepoOwner/$RepoName.git"
    git push $remoteUrl $PRBranch
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push branch"
    }

    Write-Host "Successfully pushed branch $PRBranch"

    # Create draft PR using GitHub CLI
    Write-Host "Creating draft PR in $RepoOwner/$RepoName using gh CLI..."

    # Set the authentication token for gh CLI
    $env:GH_TOKEN = $AuthToken

    # Create the draft PR using gh CLI
    $ghOutput = gh pr create --repo "$RepoOwner/$RepoName" --title $PRTitle --body $PRBody --base $BaseBranch --head $PRBranch --draft 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create PR using gh CLI: $ghOutput"
    }

    # Extract PR URL from gh output
    $prUrl = $ghOutput.Trim()
    Write-Host "Created draft PR: $prUrl"

    # Add "Do Not Merge" label using gh CLI
    Write-Host "Adding 'Do Not Merge' label to PR..."
    $labelOutput = gh pr edit $prUrl --add-label "Do Not Merge" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to add 'Do Not Merge' label (label may not exist): $labelOutput"
    } else {
        Write-Host "Successfully added 'Do Not Merge' label"
    }

    Write-Host "Preview PR created successfully: $prUrl"

} catch {
    Write-Error "Error creating PR: $_"
    exit 1
} finally {
    Pop-Location
}
